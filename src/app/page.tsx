'use client'
import { FormEvent, useRef, useState } from 'react'

declare global {
  interface CredentialRequestOptions {
    otp: {
      transport: string[]
    }
  }

  interface Credential {
    code: string
  }
}

export default function Home() {
  const formRef = useRef(null)
  const otpRef = useRef<HTMLInputElement | null>(null)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const onsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    console.log('submitting form...')

    const form = formRef.current
    if (!form) {
      setError('Form not found')
      return console.error('Form not found')
    }

    const formData = new FormData(form)
    const phoneNumber = formData.get('phone-number')

    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log('getting otp...')

    try {
      const otp = await navigator.credentials.get({ otp: { transport: ['sms'] } })

      if (otp) {
        setOtp(JSON.stringify(otp))
        console.log('otp: ', otp.code)
        if (otpRef?.current) {
          otpRef.current.value = otp.code
        }
      }
    } catch (error) {
      console.log(error)
      setError(JSON.stringify(error))
    }
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      <form ref={formRef} onSubmit={onsSubmit} className="flex gap-3">
        <input
          type="number"
          name="phone-number"
          id="phone-number"
          placeholder="Phone number"
          inputMode="numeric"
          pattern="[0-9]*"
          required
        />
        <button type="submit">submit</button>
      </form>

      <input
        ref={otpRef}
        type="text"
        name="otp"
        placeholder="OTP"
        autoComplete="one-time-code"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        className="w-fit"
      />

      <p>OTP: {otp}</p>

      {error && <p className="text-red-400 pt-10">{error}</p>}
    </div>
  )
}
