import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET: Fetch friend requests and friends list
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type"); // "requests", "sent", or "friends"

  if (!id) {
    return NextResponse.json(
      { error: "User ID not provided" },
      { status: 400 }
    );
  }

  try {
    // Get pending friend requests (incoming)
    if (type === "requests") {
      const { data: requests, error } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:sender_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("receiver_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching friend requests:", error);
        return NextResponse.json(
          { error: "Error fetching friend requests" },
          { status: 500 }
        );
      }

      return NextResponse.json(requests || []);
    }

    // Get sent friend requests (outgoing pending)
    if (type === "sent") {
      const { data: requests, error } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          receiver:receiver_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("sender_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching sent requests:", error);
        return NextResponse.json(
          { error: "Error fetching sent requests" },
          { status: 500 }
        );
      }

      return NextResponse.json(requests || []);
    }

    // Get friends list
    if (type === "friends") {
      // Get accepted friend requests where user is sender
      const { data: sentRequests, error: sentError } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          receiver:receiver_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("sender_id", id)
        .eq("status", "accepted");

      if (sentError) {
        console.error("Error fetching sent requests:", sentError);
        return NextResponse.json(
          { error: "Error fetching friends" },
          { status: 500 }
        );
      }

      // Get accepted friend requests where user is receiver
      const { data: receivedRequests, error: receivedError } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:sender_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("receiver_id", id)
        .eq("status", "accepted");

      if (receivedError) {
        console.error("Error fetching received requests:", receivedError);
        return NextResponse.json(
          { error: "Error fetching friends" },
          { status: 500 }
        );
      }

      // Combine and format friends list
      const friends = [
        ...(sentRequests || []).map((req: any) => ({
          id: req.receiver.id,
          email: req.receiver.email,
          user_name: req.receiver.user_name,
          friendship_id: req.id,
          added_at: req.created_at,
        })),
        ...(receivedRequests || []).map((req: any) => ({
          id: req.sender.id,
          email: req.sender.email,
          user_name: req.sender.user_name,
          friendship_id: req.id,
          added_at: req.created_at,
        })),
      ];

      return NextResponse.json(friends);
    }

    // Get all friend-related data if no type specified
    const [requestsResult, friendsResult] = await Promise.all([
      supabase
        .from("friend_requests")
        .select(
          `
          *,
          sender:sender_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("receiver_id", id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),

      supabase
        .from("friend_requests")
        .select(
          `
          *,
          receiver:receiver_id (
            id,
            email,
            user_name
          )
        `
        )
        .eq("sender_id", id)
        .eq("status", "accepted"),
    ]);

    const { data: receivedFriends, error: receivedFriendsError } =
      await supabase
        .from("friend_requests")
        .select(
          `
        *,
        sender:sender_id (
          id,
          email,
          user_name
        )
      `
        )
        .eq("receiver_id", id)
        .eq("status", "accepted");

    const friends = [
      ...(friendsResult.data || []).map((req: any) => ({
        id: req.receiver.id,
        email: req.receiver.email,
        user_name: req.receiver.user_name,
        friendship_id: req.id,
        added_at: req.created_at,
      })),
      ...(receivedFriends || []).map((req: any) => ({
        id: req.sender.id,
        email: req.sender.email,
        user_name: req.sender.user_name,
        friendship_id: req.id,
        added_at: req.created_at,
      })),
    ];

    return NextResponse.json({
      requests: requestsResult.data || [],
      friends,
    });
  } catch (err) {
    console.error("Friends API GET Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Send friend request
export async function POST(req: Request) {
  try {
    const { id, receiverId } = await req.json();

    if (!id || !receiverId) {
      return NextResponse.json(
        { error: "User ID and Receiver ID are required" },
        { status: 400 }
      );
    }

    if (receiverId === id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a friend" },
        { status: 400 }
      );
    }

    // Check if a friend request already exists (in any direction)
    const { data: existingRequest, error: checkError } = await supabase
      .from("friend_requests")
      .select("*")
      .or(
        `and(sender_id.eq.${id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${id})`
      )
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing request:", checkError);
      return NextResponse.json(
        { error: "Error checking friend request status" },
        { status: 500 }
      );
    }

    if (existingRequest) {
      if (existingRequest.status === "accepted") {
        return NextResponse.json(
          { error: "You are already friends" },
          { status: 400 }
        );
      }
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "Friend request already pending" },
          { status: 400 }
        );
      }
    }

    // Create friend request
    const { error } = await supabase.from("friend_requests").insert({
      sender_id: id,
      receiver_id: receiverId,
      status: "pending",
    });

    if (error) {
      console.error("Error creating friend request:", error);
      return NextResponse.json(
        { error: error.message || "Error sending friend request" },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Friends API POST Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Accept or update friend request
export async function PUT(req: Request) {
  try {
    const { id, requestId, action } = await req.json();

    if (!id || !requestId || !action) {
      return NextResponse.json(
        { error: "User ID, Request ID and action are required" },
        { status: 400 }
      );
    }

    // Verify the request belongs to the current user
    const { data: request, error: fetchError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 }
      );
    }

    if (action === "accept") {
      // Update request status to accepted
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) {
        console.error("Error accepting friend request:", error);
        return NextResponse.json(
          { error: "Error accepting friend request" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Friend request accepted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Friends API PUT Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Reject friend request or remove friend
export async function DELETE(req: Request) {
  try {
    const { id, requestId, friendId } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Reject pending friend request (incoming) or cancel sent request (outgoing)
    if (requestId) {
      // Verify the request belongs to the current user (as sender or receiver)
      const { data: request, error: fetchError } = await supabase
        .from("friend_requests")
        .select("*")
        .eq("id", requestId)
        .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
        .single();

      if (fetchError || !request) {
        return NextResponse.json(
          { error: "Friend request not found" },
          { status: 404 }
        );
      }

      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .eq("id", requestId);

      if (error) {
        console.error("Error deleting friend request:", error);
        return NextResponse.json(
          { error: "Error deleting friend request" },
          { status: 500 }
        );
      }

      const message = request.sender_id === id
        ? "Friend request cancelled"
        : "Friend request rejected";

      return NextResponse.json({ message });
    }

    // Remove friend
    if (friendId) {
      // Find and delete the friendship record
      const { error } = await supabase
        .from("friend_requests")
        .delete()
        .or(
          `and(sender_id.eq.${id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${id})`
        )
        .eq("status", "accepted");

      if (error) {
        console.error("Error removing friend:", error);
        return NextResponse.json(
          { error: "Error removing friend" },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: "Friend removed" });
    }

    return NextResponse.json(
      { error: "Request ID or Friend ID is required" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Friends API DELETE Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
