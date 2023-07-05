import { NextRequest, NextResponse } from 'next/server'
import * as crypto from "crypto";
import { uploadWizard } from "../../../../upload-wizard";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    console.log(process.env.AWS_ACCESS_KEY_ID)
    const {id, url, confirmToken, expiry} = await uploadWizard.signedUploadUrl()


    return NextResponse.json({
        id,
        confirmToken,
        url,
        expiry: expiry,
    })
}
