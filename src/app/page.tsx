'use client'
import Image from 'next/image'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { UAParser } from 'ua-parser-js'

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
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [countries, setCountries] = useState([])
  const [selectedCountry, setSelectedCountry] = useState<any>(null)
  const [isValidCode, setIsValidCode] = useState(false)
  const [code, setCode] = useState('')
  const [otpInput, setOtpInput] = useState('')

  const formRef = useRef(null)

  const onsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const formData = new FormData(formRef.current!)
    const phoneNumber = formData.get('phone-number')
    const country = selectedCountry?.cca2

    const res = await fetch(process.env.NEXT_PUBLIC_PATH + '/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ number: phoneNumber, country })
    })

    if (!res.ok) {
      setError('Failed to send OTP')
      setIsLoading(false)
      return
    }

    const data = await res.json()
    if (data) {
      setCode(data.code)
      // check that we are not on a desktop OS
      if (!['windows', 'mac', 'linux'].includes(new UAParser().getOS().name?.toLocaleLowerCase() ?? '')) {
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 15000) // timout after 15 seconds
        try {
          const otp = await navigator.credentials.get({
            otp: {
              transport: ['sms']
            },
            signal: controller.signal
          })
          if (otp?.code) {
            setOtpInput(otp.code)
            if (data.code === otp.code) {
              setIsValidCode(true)
            }
          }
        } catch (_err) {
          setError('Failed to autofill OTP')
        }
      }
    }
    setIsLoading(false)
  }

  const handleOtpInput = (e: FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value
    setOtpInput(value)
    setIsValidCode(+value === +code)
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
            required
            autoComplete="mobile tel-national"
          />
          <button
            type="submit"
            className="bg-green-400 text-green-950 border-none font-semibold disabled:text-green-900 disabled:bg-green-600"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Submit'}
          </button>
        </form>
        {error && <p className="text-red-400 text-center">{error}</p>}
        <input
          value={otpInput}
          type="text"
          name="otp"
          placeholder="OTP"
          maxLength={4}
          className={`mt-4
           ${isValidCode && 'border-green-400 text-green-400'}
           ${otpInput.length === 4 && !isValidCode && 'border-red-400 text-red-400'}`}
          onChange={handleOtpInput}
        />
        <div className="h-5">
          {otpInput.length === 4 && (
            <>
              {isValidCode ? (
                <p className="text-green-400 text-center">OTP is valid</p>
              ) : (
                <p className="text-red-400 text-center">OTP is invalid</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
