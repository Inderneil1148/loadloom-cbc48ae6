import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  email?: string
  business?: string
  planName?: string
  amount?: string
  reference?: string
}

const PaymentAdminAlert = ({ email, business, planName, amount, reference }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New plan payment to verify</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New payment to verify</Heading>
        <Text style={row}><strong>Account:</strong> {email || '—'}</Text>
        <Text style={row}><strong>Business:</strong> {business || '—'}</Text>
        <Text style={row}><strong>Plan:</strong> {planName || '—'} {amount ? `(${amount})` : ''}</Text>
        <Text style={row}><strong>Reference:</strong> {reference || '—'}</Text>
        <Text style={row}>Open Super Admin, Payments tab, to see the screenshot and approve.</Text>
        <Text style={{ fontSize: '11px', color: '#999999', margin: '24px 0 0' }}>
          LoadLoom by The Social INK, India. You received this because of activity on your LoadLoom account or website.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentAdminAlert,
  subject: (d: Record<string, any>) => `Payment to verify: ${d['planName'] || 'plan'} from ${d['business'] || d['email'] || 'a user'}`,
  displayName: 'Plan payment alert (to owner)',
  to: 'inderneilkanagali@gmail.com',
  previewData: { email: 'ravi@example.com', business: 'Shree Sand', planName: 'Growth', amount: '₹2,499', reference: 'UTR 4123' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px', borderBottom: '3px solid #e33825', paddingBottom: '8px' }
const row = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 8px' }
