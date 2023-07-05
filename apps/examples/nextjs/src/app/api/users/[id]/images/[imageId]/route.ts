import { NextRequest, NextResponse } from "next/server";
import { uploadWizard } from "../../../../../upload-wizard";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  // TODO: delete image
  await uploadWizard.delete(params.imageId)

  return NextResponse.json(undefined)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, imageId: string } }
) {
  // TODO: get image
  await uploadWizard.getData(params.imageId)

  return NextResponse.json(undefined)
}
