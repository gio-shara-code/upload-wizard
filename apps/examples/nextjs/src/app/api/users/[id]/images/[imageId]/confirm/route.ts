import { NextRequest, NextResponse } from "next/server";
import { uploadWizard } from "../../../../../../upload-wizard";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  // TODO: validate confirm Token
  await uploadWizard.confirmUpload(params.imageId, 'confirmToken')

  return NextResponse.json(undefined)
}
