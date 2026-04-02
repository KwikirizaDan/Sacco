import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: "#ffffff",
    width: 243,
    height: 153,
  },
  card: {
    width: 243,
    height: 153,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    backgroundColor: "#16a34a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  headerSub: {
    color: "#d1fae5",
    fontSize: 7,
  },
  body: {
    flexDirection: "row",
    padding: 10,
    flex: 1,
  },
  photoContainer: {
    width: 55,
    height: 55,
    borderRadius: 4,
    overflow: "hidden",
    marginRight: 10,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  photo: {
    width: 55,
    height: 55,
  },
  photoPlaceholder: {
    width: 55,
    height: 55,
    backgroundColor: "#16a34a",
    justifyContent: "center",
    alignItems: "center",
  },
  photoInitials: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
  },
  label: {
    fontSize: 7,
    color: "#6b7280",
    width: 45,
  },
  value: {
    fontSize: 7,
    color: "#111827",
    fontWeight: "bold",
    flex: 1,
  },
  footer: {
    backgroundColor: "#f9fafb",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6,
    color: "#6b7280",
  },
  memberCode: {
    fontSize: 7,
    color: "#16a34a",
    fontWeight: "bold",
  },
  signatureBox: {
    borderTopWidth: 1,
    borderTopColor: "#9ca3af",
    marginTop: 8,
    paddingTop: 2,
    width: 70,
  },
  signatureLabel: {
    fontSize: 6,
    color: "#6b7280",
    textAlign: "center",
  },
})

interface MemberIdCardProps {
  member: {
    full_name: string
    member_code: string
    phone?: string | null
    national_id?: string | null
    address?: string | null
    joined_at?: Date | null
    photo_url?: string | null
    status: string
  }
  sacco: {
    name: string
    logoUrl?: string
  }
}

export function MemberIdCardDocument({ member, sacco }: MemberIdCardProps) {
  return (
    <Document>
      <Page size={{ width: 243, height: 153 }} style={styles.page}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerText}>{sacco.name}</Text>
              <Text style={styles.headerSub}>Member Identity Card</Text>
            </View>
            <Text style={{ color: "#d1fae5", fontSize: 7 }}>
              {member.status.toUpperCase()}
            </Text>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Photo */}
            <View style={styles.photoContainer}>
              {member.photo_url ? (
                <Image src={member.photo_url} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoInitials}>
                    {member.full_name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Info */}
            <View style={styles.info}>
              <Text style={styles.name}>{member.full_name}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Code:</Text>
                <Text style={styles.value}>{member.member_code}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{member.phone ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>ID No:</Text>
                <Text style={styles.value}>{member.national_id ?? "—"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Address:</Text>
                <Text style={styles.value}>{member.address ?? "—"}</Text>
              </View>
              <View style={styles.signatureBox}>
                <Text style={styles.signatureLabel}>Member Signature</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Joined:{" "}
              {member.joined_at
                ? new Date(member.joined_at).toLocaleDateString()
                : "—"}
            </Text>
            <Text style={styles.memberCode}>{member.member_code}</Text>
            <Text style={styles.footerText}>Valid · {sacco.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
