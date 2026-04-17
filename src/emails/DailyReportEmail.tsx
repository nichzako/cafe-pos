import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";

export type DailyReportData = {
  date: string; // วันที่รายงาน เช่น "17 เม.ย. 2569"
  shopName: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  paymentBreakdown: { method: string; count: number; amount: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
};

type DailyReportEmailProps = { report: DailyReportData };

const METHOD_LABEL: Record<string, string> = {
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  card: "บัตร",
  mockup: "ทดสอบ",
};

export function DailyReportEmail({ report }: DailyReportEmailProps) {
  return (
    <Html lang="th">
      <Head />
      <Preview>
        รายงานยอดขายประจำวัน {report.date} — {report.shopName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.shopName}>{report.shopName}</Heading>
            <Text style={styles.subtitle}>
              รายงานยอดขายประจำวัน {report.date}
            </Text>
          </Section>

          {/* Summary cards */}
          <Section style={styles.section}>
            <Row>
              <Column style={styles.statCard}>
                <Text style={styles.statValue}>
                  {report.completedOrders}
                </Text>
                <Text style={styles.statLabel}>ออเดอร์สำเร็จ</Text>
              </Column>
              <Column style={{ ...styles.statCard, borderLeft: "1px solid #f0e8e0" }}>
                <Text style={{ ...styles.statValue, color: "#4a3728" }}>
                  ฿{report.totalRevenue.toLocaleString("th-TH")}
                </Text>
                <Text style={styles.statLabel}>รายได้รวม</Text>
              </Column>
              <Column style={{ ...styles.statCard, borderLeft: "1px solid #f0e8e0" }}>
                <Text style={{ ...styles.statValue, color: "#dc2626" }}>
                  {report.cancelledOrders}
                </Text>
                <Text style={styles.statLabel}>ออเดอร์ยกเลิก</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Payment breakdown */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>การชำระเงินแยกตามวิธี</Text>
            {report.paymentBreakdown.map((p) => (
              <Row key={p.method} style={{ marginBottom: 8 }}>
                <Column>
                  <Text style={styles.rowLabel}>
                    {METHOD_LABEL[p.method] ?? p.method}
                    <span style={styles.rowCount}> ({p.count} ออเดอร์)</span>
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={styles.rowValue}>
                    ฿{p.amount.toLocaleString("th-TH")}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          {report.topItems.length > 0 && (
            <>
              <Hr style={styles.hr} />
              <Section style={styles.section}>
                <Text style={styles.sectionTitle}>เมนูขายดี (Top 5)</Text>
                {report.topItems.slice(0, 5).map((item, i) => (
                  <Row key={i} style={{ marginBottom: 8 }}>
                    <Column>
                      <Text style={styles.rowLabel}>
                        <span style={styles.rank}>{i + 1}. </span>
                        {item.name}
                      </Text>
                      <Text style={styles.rowCount}>{item.qty} แก้ว/จาน</Text>
                    </Column>
                    <Column style={{ textAlign: "right" }}>
                      <Text style={styles.rowValue}>
                        ฿{item.revenue.toLocaleString("th-TH")}
                      </Text>
                    </Column>
                  </Row>
                ))}
              </Section>
            </>
          )}

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              รายงานนี้สร้างอัตโนมัติโดย {report.shopName} POS
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#faf6f2",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    margin: 0,
    padding: "20px 0",
  },
  container: {
    maxWidth: 520,
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  header: {
    backgroundColor: "#4a3728",
    padding: "24px 32px",
  },
  shopName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    color: "#c9a87c",
    fontSize: 13,
    margin: "4px 0 0",
  },
  section: {
    padding: "20px 32px",
  },
  hr: {
    borderColor: "#f0e8e0",
    borderWidth: 1,
    margin: "0 32px",
  },
  statCard: {
    textAlign: "center" as const,
    padding: "8px 0",
  },
  statValue: {
    color: "#1c1917",
    fontSize: 28,
    fontWeight: 700,
    margin: 0,
    lineHeight: "1.2",
  },
  statLabel: {
    color: "#78716c",
    fontSize: 12,
    margin: "4px 0 0",
  },
  sectionTitle: {
    color: "#44403c",
    fontSize: 13,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    margin: "0 0 12px",
  },
  rowLabel: {
    color: "#1c1917",
    fontSize: 14,
    margin: 0,
  },
  rowCount: {
    color: "#78716c",
    fontSize: 12,
  },
  rowValue: {
    color: "#1c1917",
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
  },
  rank: {
    color: "#4a3728",
    fontWeight: 700,
  },
  footer: {
    backgroundColor: "#faf6f2",
    padding: "16px 32px",
    textAlign: "center" as const,
  },
  footerText: {
    color: "#a8a29e",
    fontSize: 12,
    margin: 0,
  },
};
