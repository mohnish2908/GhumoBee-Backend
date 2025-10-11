exports.forgotPasswordMail = (otp) => {
    return `
        <div style="font-family: Arial, sans-serif; background: #f3f4f6; padding: 32px;">
            <div style="max-width: 400px; margin: auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 32px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <img src="https://res.cloudinary.com/dmaxu09vv/image/upload/v1757593286/business_documents/te0qhz26l4bxjavldgi0.webp" alt="Logo" style="height: 48px; margin: auto;" />
                </div>
                <h1 style="color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 16px; text-align: center;">Forgot Password</h1>
                <p style="font-size: 16px; color: #374151; margin-bottom: 24px; text-align: center;">
                    You requested to reset your password. Please use the OTP below to proceed:
                </p>
                <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; background: #eff6ff; color: #2563eb; font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 32px; border-radius: 8px; border: 1px dashed #2563eb;">
                        ${otp}
                    </span>
                </div>
                <p style="font-size: 14px; color: #6b7280; text-align: center;">
                    If you did not request this, please ignore this email.
                </p>
            </div>
        </div>
    `;
}