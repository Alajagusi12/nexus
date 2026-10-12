import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("--- Presence Ping Received ---");

    let body = {};
    try {
      body = await request.json();
      console.log("Ping Payload:", body);
    } catch (e) {
      console.log("No JSON body received.");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Pong", 
      timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error("PING API ERROR:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" }, 
      { status: 500 }
    );
  }
}