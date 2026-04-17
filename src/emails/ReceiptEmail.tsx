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
import type { ReceiptData } from "@/types";

type ReceiptEmailProps = { receipt: ReceiptData };

const METHOD_LABEL: Record<string, string> = {
  cash: "เงินสด",
  promptpay: "พร้อมเพย์",
  card: "บัตรเครดิต/เดบิต",
  mockup: "ทดสอบ",
};

export function ReceiptEmail({ receipt }: ReceiptEmailProps) {
  const paidAtFormatted = new Date(receipt.paidAt).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <Html lang="th">
      <Head />
      <Preview>
        ใบเสร็จ {receipt.receiptNumber} — {receipt.shopName}
      </Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Header */}
          <Section style={styles.header}>
            <Heading style={styles.shopName}>{receipt.shopName}</Heading>
            <Text style={styles.receiptNumber}>
              ใบเสร็จ {receipt.receiptNumber}
            </Text>
          </Section>

          {/* Meta */}
          <Section style={styles.section}>
            <Row>
              <Column>
                <Text style={styles.label}>ออเดอร์</Text>
                <Text style={styles.value}>{receipt.orderNumber}</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={styles.label}>วันที่</Text>
                <Text style={styles.value}>{paidAtFormatted}</Text>
              </Column>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Column>
                <Text style={styles.label}>โต๊ะ</Text>
                <Text style={styles.value}>{receipt.tableName ?? "—"}</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={styles.label}>พนักงาน</Text>
                <Text style={styles.value}>{receipt.staffName}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Items */}
          <Section style={styles.section}>
            {receipt.items.map((item, i) => (
              <Row key={i} style={{ marginBottom: 10 }}>
                <Column>
                  <Text style={styles.itemName}>
                    {item.name}
                    {item.note ? (
                      <span style={styles.itemNote}> ({item.note})</span>
                    ) : null}
                  </Text>
                  <Text style={styles.itemQty}>
                    ฿{item.unitPrice.toLocaleString("th-TH")} × {item.qty}
                  </Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={styles.itemTotal}>
                    ฿{item.lineTotal.toLocaleString("th-TH")}
                  </Text>
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={styles.hr} />

          {/* Totals */}
          <Section style={styles.section}>
            <Row>
              <Column>
                <Text style={styles.totalLabel}>ยอดรวม</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={styles.totalValue}>
                  ฿{receipt.subtotal.toLocaleString("th-TH")}
                </Text>
              </Column>
            </Row>

            {receipt.discount > 0 && (
              <Row>
                <Column>
                  <Text style={styles.totalLabel}>ส่วนลด</Text>
                </Column>
                <Column style={{ textAlign: "right" }}>
                  <Text style={{ ...styles.totalValue, color: "#16a34a" }}>
                    −฿{receipt.discount.toLocaleString("th-TH")}
                  </Text>
                </Column>
              </Row>
            )}

            <Row style={styles.grandTotalRow}>
              <Column>
                <Text style={styles.grandTotalLabel}>ยอดสุทธิ</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={styles.grandTotalValue}>
                  ฿{receipt.total.toLocaleString("th-TH")}
                </Text>
              </Column>
            </Row>

            <Row style={{ marginTop: 8 }}>
              <Column>
                <Text style={styles.label}>ชำระด้วย</Text>
              </Column>
              <Column style={{ textAlign: "right" }}>
                <Text style={styles.value}>
                  {METHOD_LABEL[receipt.paymentMethod] ?? receipt.paymentMethod}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              ขอบคุณที่ใช้บริการ {receipt.shopName}
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
    maxWidth: 480,
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
  receiptNumber: {
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
  label: {
    color: "#78716c",
    fontSize: 12,
    margin: 0,
    lineHeight: "1.4",
  },
  value: {
    color: "#1c1917",
    fontSize: 14,
    fontWeight: 600,
    margin: "2px 0 0",
  },
  itemName: {
    color: "#1c1917",
    fontSize: 14,
    margin: 0,
    lineHeight: "1.4",
  },
  itemNote: {
    color: "#78716c",
    fontSize: 12,
  },
  itemQty: {
    color: "#78716c",
    fontSize: 12,
    margin: "2px 0 0",
  },
  itemTotal: {
    color: "#1c1917",
    fontSize: 14,
    fontWeight: 600,
    margin: 0,
  },
  totalLabel: {
    color: "#44403c",
    fontSize: 14,
    margin: "4px 0",
  },
  totalValue: {
    color: "#1c1917",
    fontSize: 14,
    margin: "4px 0",
  },
  grandTotalRow: {
    borderTop: "2px solid #4a3728",
    paddingTop: 10,
    marginTop: 8,
  },
  grandTotalLabel: {
    color: "#1c1917",
    fontSize: 16,
    fontWeight: 700,
    margin: 0,
  },
  grandTotalValue: {
    color: "#4a3728",
    fontSize: 22,
    fontWeight: 700,
    margin: 0,
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
