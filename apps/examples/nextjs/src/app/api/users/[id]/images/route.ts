import { NextRequest, NextResponse } from 'next/server'
import { uploadWizard } from '../../../../upload-wizard'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    let response
    try {
        response = await uploadWizard.signedUploadUrl()
    } catch (e) {
        console.log('e', e)
        return new Response('Internal server error', {
            status: 500,
        })
    }

    return NextResponse.json(response)
}
