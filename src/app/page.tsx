'use client'
import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'

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
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState<any>(null)
  const formRef = useRef(null)
  const otpRef = useRef<HTMLInputElement | null>(null)

  const onsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const form = formRef.current
    if (!form) {
      return
    }

    const formData = new FormData(form)
    const phoneNumber = formData.get('phone-number')
    const country = selectedCountry?.cca2

    const res = await fetch('/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ number: phoneNumber, country })
    })

    if (!res.ok) {
      setError('Failed to send OTP')
      return
    }

    const data = await res.json()

    if (data) {
      try {
        const otp = await navigator.credentials.get({ otp: { transport: ['sms'] } })
        if (otp) {
          setOtp(JSON.stringify(otp))
          if (otpRef?.current) {
            otpRef.current.value = otp.code
          }
        }
      } catch (error) {
        setError('Failed to get OTP')
      }
    }
  }

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all')
      .then((res) => res.json())
      .then((data) => {
        setCountries(data.sort((a: any, b: any) => a.name.common.localeCompare(b.name.common)))
        const country = navigator.language.split('-')[1].toUpperCase()
        setSelectedCountry(data.find((c: any) => c.cca2 === country))
      })
  }, [])

  return (
    <div className="p-4 flex flex-col gap-6 h-screen">
      <div className="m-auto flex flex-col gap-4">
        <form ref={formRef} onSubmit={onsSubmit} className="flex gap-3 flex-col">
          <div className="flex gap-3">
            {countries && (
              <select
                name="country"
                id="country"
                className="w-56"
                value={selectedCountry?.cca2}
                onChange={(e) => setSelectedCountry(countries.find((c: any) => c.cca2 === e.target.value))}
              >
                {countries?.map((country: any) => (
                  <option key={country.cca2} value={country.cca2} className="bg-black">
                    {country.name.common}
                  </option>
                ))}
              </select>
            )}
            {selectedCountry && (
              <Image
                src={selectedCountry?.flags?.png ?? ''}
                alt={selectedCountry?.flags?.alt ?? ''}
                width={56}
                height={56}
                className="rounded aspect-[2:3]"
              />
            )}
          </div>
          <input
            type="tel"
            name="phone-number"
            id="phone-number"
            placeholder="Phone number"
            inputMode="numeric"
            pattern="[0-9]*"
            required
          />
          <button type="submit" className="bg-green-400 text-green-950 border-none font-semibold">
            Submit
          </button>
        </form>

        {error && <p className="text-red-400 pt-10">{error}</p>}

        <input ref={otpRef} type="text" name="otp" placeholder="OTP" className="mt-6" />

        {otp && <p>Your OTP: {otp}</p>}
      </div>
    </div>
  )
}
