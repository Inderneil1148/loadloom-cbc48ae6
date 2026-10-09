import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  business?: string
  phone?: string
  email?: string
  message?: string
}

const Row = ({ label, value }: { label: string; value?: string | undefined }) => (
  <Text style={row}>
    <strong style={{ color: '#000000' }}>{label}:</strong> {value || '—'}
  </Text>
)

const ContactEnquiry = ({ name, business, phone, email, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New LoadLoom enquiry from {name || 'a visitor'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New enquiry</Heading>
        <Row label="Name" value={name} />
        <Row label="Business" value={business} />
        <Row label="Phone" value={phone} />
        <Row label="Email" value={email} />
        <Section style={box}>
          <Text style={{ ...row, margin: 0, whiteSpace: 'pre-wrap' }}>{message || '—'}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactEnquiry,
  subject: (d: Record<string, any>) => `New enquiry from ${d['business'] || d['name'] || 'website'}`,
  displayName: 'Contact enquiry (to owner)',
  to: 'inderneilkanagali@gmail.com',
  previewData: { name: 'Ravi', business: 'Shree Sand', phone: '9876543210', email: 'ravi@example.com', message: '5 tippers, 30 loads a day.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 20px', borderBottom: '3px solid #e33825', paddingBottom: '8px' }
const row = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 8px' }
const box = { backgroundColor: '#f6f7f9', borderRadius: '8px', padding: '14px', marginTop: '12px' }
