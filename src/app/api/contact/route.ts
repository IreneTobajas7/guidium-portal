import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, company, role, subject, message } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !company || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create email content
    const emailContent = `
New Contact Form Submission from GUIDIUM Website

Name: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || 'Not provided'}
Company: ${company}
Role: ${role || 'Not provided'}
Subject: ${subject}

Message:
${message}

---
This message was sent from the GUIDIUM contact form.
    `.trim()

    // For now, we'll log the email content and return success
    // In production, you would integrate with an email service like SendGrid, Mailgun, or AWS SES
    console.log('=== CONTACT FORM SUBMISSION ===')
    console.log('To: irene@lukinconsulting.com')
    console.log('Subject: New Contact Form Submission - ' + subject)
    console.log('Content:', emailContent)
    console.log('================================')

    // TODO: Replace this with actual email sending logic
    // Example with a hypothetical email service:
    // await sendEmail({
    //   to: 'irene@lukinconsulting.com',
    //   subject: `New Contact Form Submission - ${subject}`,
    //   text: emailContent,
    //   from: 'noreply@guidium.com'
    // })

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you for your message. We will get back to you within 24 hours.' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
} 