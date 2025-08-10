import { NextResponse } from 'next/server';

export async function GET() {
  const verificationData = {
    associatedApplications: [
      {
        applicationId: "daf7b4de-b62a-43d4-a6bf-4106de1c706e"
      }
    ]
  };

  return NextResponse.json(verificationData, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
