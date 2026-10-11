import * as React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  planName?: string
  amount?: string
  reference?: string
}

const PaymentReceived = ({ planName, amount, reference }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your payment. Your plan starts within 24 hours.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>LoadLoom</Text>
        <Heading style={h1}>Payment received</Heading>
        <Text style={text}>
          Thank you. We received your payment for the <strong>{planName || 'selected'}</strong> plan
          {amount ? ` (${amount})` : ''}.
        </Text>
        <Section style={box}>
          <Text style={{ ...text, margin: 0, color: '#000000', fontWeight: 'bold' }}>
            Your plan will start working within 24 hours.
          </Text>
        </Section>
        {reference ? <Text style={small}>Reference: {reference}</Text> : null}
        <Text style={text}>Until then you can keep using LoadLoom on the Free plan.</Text>
        <Text style={{ fontSize: '11px', color: '#999999', margin: '24px 0 0' }}>
          LoadLoom by The Social INK, India. You received this because of activity on your LoadLoom account or website.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReceived,
  subject: (d: Record<string, any>) => `Payment received for your ${d['planName'] || ''} plan`.replace('  ', ' '),
  displayName: 'Plan payment received',
  previewData: { planName: 'Growth', amount: '₹2,499', reference: 'UTR 412345678901' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif' }
const container = { padding: '24px 25px' }
const brand = { fontSize: '16px', fontWeight: 'bold' as const, color: '#e33825', margin: '0 0 12px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#000000', margin: '0 0 16px', borderBottom: '3px solid #e33825', paddingBottom: '8px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 14px' }
const small = { fontSize: '12px', color: '#8a8c92', margin: '0 0 14px' }
const box = { backgroundColor: '#ffde5f', borderLeft: '4px solid #e33825', borderRadius: '6px', padding: '14px', margin: '0 0 14px' }
