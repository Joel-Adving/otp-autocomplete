import { type NextRequest } from 'next/server'
import { parsePhoneNumber } from 'awesome-phonenumber'
import { Twilio } from 'twilio'

const client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
const origin = process.env.ORIGIN

export async function POST(request: NextRequest) {
  const body = await request.json()
  const number = body?.number
  const regionCode = body?.country
  const parsedNummer = parsePhoneNumber(number, { regionCode: regionCode })

  if (!parsedNummer.valid || !parsedNummer.possible) {
    return Response.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const code = Math.floor(1000 + Math.random() * 9000)
  const message = `${code} is your verification code \n\n @${origin} #${code}`

  try {
    const res = await client.messages.create({
      body: message,
      from: process.env.SENDER_PHONE_NUMBER,
      to: parsedNummer.number.e164
    })
    console.log(res)
    return Response.json({ success: 'Message sent' })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
