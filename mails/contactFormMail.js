exports.contactFormMail = (name, email, subject, message) => {
    return `
        <div style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 32px;">
            <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px;">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://res.cloudinary.com/dmaxu09vv/image/upload/v1757593286/business_documents/te0qhz26l4bxjavldgi0.webp" alt="Logo" style="height: 48px; margin: auto;" />
                </div>

                <!-- Title -->
                <h1 style="color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">
                    New Contact Form Submission
                </h1>

                <p style="font-size: 16px; color: #374151; margin-bottom: 24px; text-align: center;">
                    You received a new message from your website’s contact form.
                </p>

                <!-- Details -->
                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb;">
                    <p style="font-size: 16px; color: #111827; margin-bottom: 8px;">
                        <strong style="color: #2563eb;">Name:</strong> ${name}
                    </p>
                    <p style="font-size: 16px; color: #111827; margin-bottom: 8px;">
                        <strong style="color: #2563eb;">Email:</strong> ${email}
                    </p>
                    <p style="font-size: 16px; color: #111827; margin-bottom: 8px;">
                        <strong style="color: #2563eb;">Subject:</strong> ${subject}
                    </p>
                    <p style="font-size: 16px; color: #111827; margin-top: 16px;">
                        <strong style="color: #2563eb;">Message:</strong><br />
                        <span style="display: inline-block; background: #eff6ff; padding: 12px 16px; border-radius: 8px; color: #374151; white-space: pre-line;">
                            ${message}
                        </span>
                    </p>
                </div>

                <!-- Footer -->
                <p style="font-size: 14px; color: #6b7280; text-align: center; margin-top: 24px;">
                    This message was sent from your website’s contact form.
                </p>
            </div>
        </div>
    `;
};
