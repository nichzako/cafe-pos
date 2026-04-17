"use client";

/**
 * useOrdersRealtime — Subscribe to Supabase Realtime for the orders table.
 *
 * เมื่อมีออเดอร์ใหม่ หรือสถานะออเดอร์เปลี่ยน → router.refresh() อัตโนมัติ
 * ทำให้ Next.js re-run Server Component และดึงข้อมูลล่าสุดจาก DB
 *
 * ⚠️  Security prerequisite (ต้องทำก่อน deploy จริง):
 *   1. Enable RLS บน orders table ใน Supabase Dashboard
 *      → Authentication → Policies → orders → Enable RLS ✓
 *      ถ้าไม่ enable RLS, Realtime จะส่ง event ของ order ทุกรายการให้ทุก client
 *      โดยไม่กรอง role — ข้อมูลอาจรั่วข้ามพนักงาน
 *
 * ⚙️  Infrastructure prerequisite:
 *   2. เปิด Realtime บน orders table ใน Supabase Dashboard
 *      → Database → Replication → supabase_realtime publication → orders ✓
 *      ถ้าไม่เปิด hook จะรอ SUBSCRIBED ไม่ได้รับ → timeout → status = "error"
 *
 * USAGE: const { status, isRefreshing } = useOrdersRealtime();
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type RealtimeStatus = "connecting" | "live" | "error";

/** ป้องกัน refresh หลายครั้งพร้อมกันเมื่อออเดอร์หลายรายการเปลี่ยนสถานะพร้อมกัน */
const REFRESH_DEBOUNCE_MS = 300;
/** ถ้าไม่ได้รับ SUBSCRIBED ภายในเวลานี้ → ถือว่า Realtime ยังไม่ได้เปิด */
const CONNECT_TIMEOUT_MS = 10_000;

export function useOrdersRealtime(): {
  status: RealtimeStatus;
  isRefreshing: boolean;
} {
  const router = useRouter();
  // Sync router into ref เพื่อให้ effect มี empty deps — ไม่ re-subscribe ทุกครั้งที่ navigate
  // router จาก useRouter() ใน Next.js 15 เป็น stable reference แต่ใช้ผ่าน ref เพื่อความชัดเจน
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [status, setStatus] = useState<RealtimeStatus>("connecting");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();

    // Debounce timer — batch rapid order events (เช่น barista เปลี่ยน 3 รายการใน 500ms)
    let debounceTimer: ReturnType<typeof setTimeout>;

    // Connection timeout — ถ้า Realtime ไม่ได้เปิดใน Dashboard จะไม่ได้รับ SUBSCRIBED เลย
    const connectTimer = setTimeout(() => {
      setStatus((prev) => (prev === "connecting" ? "error" : prev));
    }, CONNECT_TIMEOUT_MS);

    // Unique channel name ต่อ mount — ป้องกัน collision ระหว่าง tabs และ React Strict Mode double-invoke
    // Strict Mode mount → unmount → mount ทำให้มี 2 instances — ถ้าใช้ชื่อเดิม cleanup รอบแรก
    // จะลบ subscription ของรอบสองออกด้วย ทำให้ badge ค้างที่ "Live" แต่ไม่รับ event
    const channelName = `orders-realtime-${crypto.randomUUID()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // Debounce: รอให้ event นิ่ง 300ms ก่อน refresh เพื่อลด DB queries
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            // useTransition marks refresh as non-urgent — UI stays interactive during re-fetch
            startTransition(() => {
              routerRef.current.refresh();
            });
          }, REFRESH_DEBOUNCE_MS);
        }
      )
      .subscribe((subStatus) => {
        if (subStatus === "SUBSCRIBED") {
          clearTimeout(connectTimer);
          setStatus("live");
        } else if (
          subStatus === "CHANNEL_ERROR" ||
          subStatus === "TIMED_OUT" ||
          subStatus === "CLOSED" // CLOSED = connection intentionally terminated
        ) {
          clearTimeout(connectTimer);
          setStatus("error");
        }
        // "SUBSCRIBING" → keep "connecting" default
        // Supabase SDK จะ retry CHANNEL_ERROR / TIMED_OUT อัตโนมัติด้วย exponential backoff
      });

    return () => {
      clearTimeout(connectTimer);
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []); // router accessed via routerRef; startTransition is stable — effect intentionally runs once per mount

  return { status, isRefreshing: isPending };
}
