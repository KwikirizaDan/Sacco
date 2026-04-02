import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from "@react-pdf/renderer"
import { SaccoHeader } from "./sacco-header"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#16a34a",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 12,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  fieldValue: {
    fontSize: 10,
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 3,
    minHeight: 16,
  },
  fieldEmpty: {
    fontSize: 10,
    color: "#d1d5db",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 3,
    minHeight: 16,
  },
  photoBox: {
    width: 80,
    height: 100,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  photoLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 20,
  },
  signatureBox: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    marginBottom: 4,
    height: 32,
  },
  signatureLabel: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },
  declarationBox: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  declarationText: {
    fontSize: 8,
    color: "#374151",
    lineHeight: 1.6,
  },
  confirmBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 1,
  },
  confirmText: {
    flex: 1,
    fontSize: 8,
    color: "#374151",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#9ca3af",
  },
  officialBox: {
    marginTop: 16,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 4,
    padding: 10,
  },
  officialTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#15803d",
    marginBottom: 8,
  },
})

interface ApplicationFormProps {
  member: {
    full_name: string
    member_code: string
    phone?: string | null
    email?: string | null
    national_id?: string | null
    address?: string | null
    date_of_birth?: string | null
    next_of_kin?: string | null
    next_of_kin_phone?: string | null
    status: string
    joined_at?: Date | null
  }
  sacco: {
    name: string
    address?: string
    phone?: string
    email?: string
    logoUrl?: string
  }
}

function Field({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {value ? (
        <Text style={styles.fieldValue}>{value}</Text>
      ) : (
        <Text style={styles.fieldEmpty}> </Text>
      )}
    </View>
  )
}

export function ApplicationFormDocument({
  member,
  sacco,
}: ApplicationFormProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* SACCO Header */}
        <SaccoHeader
          name={sacco.name}
          address={sacco.address}
          phone={sacco.phone}
          email={sacco.email}
          logoUrl={sacco.logoUrl}
        />

        {/* Title */}
        <Text style={styles.title}>MEMBERSHIP APPLICATION FORM</Text>
        <Text style={styles.subtitle}>
          Please fill in all required fields clearly and accurately
        </Text>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Personal Information</Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Field label="Full Name" value={member.full_name} />
              </View>
              <View style={styles.row}>
                <Field label="Date of Birth" value={member.date_of_birth} />
                <Field label="National ID" value={member.national_id} />
              </View>
              <View style={styles.row}>
                <Field label="Phone Number" value={member.phone} />
                <Field label="Email Address" value={member.email} />
              </View>
              <View style={styles.row}>
                <Field label="Physical Address" value={member.address} />
              </View>
            </View>
            {/* Photo Box */}
            <View style={styles.photoBox}>
              <Text style={styles.photoLabel}>Passport{"\n"}Photo{"\n"}Here</Text>
            </View>
          </View>
        </View>

        {/* Next of Kin */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Next of Kin</Text>
          <View style={styles.row}>
            <Field label="Full Name" value={member.next_of_kin} />
            <Field label="Phone Number" value={member.next_of_kin_phone} />
          </View>
          <View style={styles.row}>
            <Field label="Relationship" value={null} />
            <Field label="Address" value={null} />
          </View>
        </View>

        {/* Membership Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Membership Details</Text>
          <View style={styles.row}>
            <Field label="Member Code" value={member.member_code} />
            <Field label="Status" value={member.status.toUpperCase()} />
            <Field
              label="Date Joined"
              value={
                member.joined_at
                  ? new Date(member.joined_at).toLocaleDateString()
                  : undefined
              }
            />
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Declaration</Text>
          <View style={styles.declarationBox}>
            <Text style={styles.declarationText}>
              I, the undersigned, hereby declare that the information provided
              in this form is true, complete, and accurate to the best of my
              knowledge. I agree to abide by the rules, regulations, and
              by-laws of {sacco.name}. I understand that providing false
              information may result in termination of my membership.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I confirm that I have read and understood the SACCO terms and conditions.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I consent to my personal data being used for SACCO operations.
            </Text>
          </View>
          <View style={styles.confirmBox}>
            <View style={styles.checkbox} />
            <Text style={styles.confirmText}>
              I agree to make regular contributions as required by {sacco.name}.
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Member Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Date</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Witness Signature</Text>
          </View>
        </View>

        {/* Official Use */}
        <View style={styles.officialBox}>
          <Text style={styles.officialTitle}>FOR OFFICIAL USE ONLY</Text>
          <View style={styles.row}>
            <Field label="Approved By" value={null} />
            <Field label="Date Approved" value={null} />
            <Field label="Ref No" value={member.member_code} />
          </View>
          <View style={styles.signatureSection}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Authorized Signature</Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>Official Stamp</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{sacco.name} · Membership Application</Text>
          <Text style={styles.footerText}>{member.member_code}</Text>
          <Text style={styles.footerText}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>
      </Page>
    </Document>
  )
}