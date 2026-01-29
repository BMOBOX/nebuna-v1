"use client";

import { useState, useEffect, useRef } from "react";
import { Session } from "next-auth";
import { Search, UserPlus, Check, X } from "lucide-react";
import { toast } from "react-toastify";

interface User {
  id: string;
  email: string;
  user_name?: string;
  wallet?: number;
  friendship_id?: string;
  added_at?: string;
}

interface SearchResult {
  id: string;
  email: string;
  user_name?: string;
  wallet?: number;
  isFriend?: boolean;
  isPending?: boolean;
}

export function Structure({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: Session["user"];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch friends and pending requests on mount
  useEffect(() => {
    if (user?.user_id) {
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
    }
  }, [user]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await fetch(`/api/friends?id=${user?.user_id}&type=friends`);
      if (res.ok) {
        const data = await res.json();
        setFriends(data || []);
      }
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const res = await fetch(`/api/friends?id=${user?.user_id}&type=requests`);
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data || []);
      }
    } catch (err) {
      console.error("Error fetching pending requests:", err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await fetch(`/api/friends?id=${user?.user_id}&type=sent`);
      if (res.ok) {
        const data = await res.json();
        setSentRequests(data || []);
      }
    } catch (err) {
      console.error("Error fetching sent requests:", err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search users by email or name
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        
        // Filter out current user and check friendship status
        const filteredResults = (data.users || [])
          .filter((u: User) => u.id !== user?.user_id)
          .map((u: User) => ({
            ...u,
            isFriend: friends.some((f) => f.id === u.id),
            isPending: pendingRequests.some((pr) => pr.sender_id === u.id),
          }));
        
        setSearchResults(filteredResults);
        setShowResults(true);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          receiverId,
        }),
      });

      if (res.ok) {
        toast.success("Friend request sent!");
        // Update search results to show pending status
        setSearchResults((prev) =>
          prev.map((r) =>
            r.id === receiverId ? { ...r, isPending: true } : r
          )
        );
        // Refresh sent requests
        fetchSentRequests();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to send friend request");
      }
    } catch (err) {
      console.error("Error sending friend request:", err);
      toast.error("Failed to send friend request");
    }
  };

  const cancelSentRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          requestId,
        }),
      });

      if (res.ok) {
        toast.success("Friend request cancelled");
        fetchSentRequests();
      } else {
        toast.error("Failed to cancel friend request");
      }
    } catch (err) {
      console.error("Error cancelling friend request:", err);
      toast.error("Failed to cancel friend request");
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          requestId,
          action: "accept",
        }),
      });

      if (res.ok) {
        toast.success("Friend request accepted!");
        fetchPendingRequests();
        fetchFriends();
      } else {
        toast.error("Failed to accept friend request");
      }
    } catch (err) {
      console.error("Error accepting friend request:", err);
      toast.error("Failed to accept friend request");
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          requestId,
        }),
      });

      if (res.ok) {
        toast.success("Friend request rejected");
        fetchPendingRequests();
      } else {
        toast.error("Failed to reject friend request");
      }
    } catch (err) {
      console.error("Error rejecting friend request:", err);
      toast.error("Failed to reject friend request");
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const res = await fetch("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.user_id,
          friendId,
        }),
      });

      if (res.ok) {
        toast.success("Friend removed");
        fetchFriends();
      } else {
        toast.error("Failed to remove friend");
      }
    } catch (err) {
      console.error("Error removing friend:", err);
      toast.error("Failed to remove friend");
    }
  };

  const getDisplayName = (user: User) => {
    return user.user_name || user.email.split("@")[0];
  };

  return (
    <div className="shadcn dark">
      <div className="space-y-8">
        {/* Search Section */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Find Friends</h2>
          <div ref={searchRef} className="relative">
            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800 rounded-lg border border-zinc-700 focus-within:border-blue-500 transition-all">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                className="bg-transparent outline-none text-white w-full placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
              />
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
              <div className="absolute mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 max-h-96 overflow-y-auto shadow-lg z-50">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 hover:bg-zinc-800 rounded-lg transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {getDisplayName(result).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {getDisplayName(result)}
                        </p>
                        <p className="text-sm text-gray-400">{result.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.isFriend ? (
                        <span className="text-sm text-green-500 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Friends
                        </span>
                      ) : result.isPending ? (
                        <span className="text-sm text-yellow-500">Pending</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(result.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && !isSearching && (
              <div className="absolute mt-2 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* Pending Friend Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Pending Requests ({pendingRequests.length})
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {request.sender?.user_name
                        ? request.sender.user_name.charAt(0).toUpperCase()
                        : request.sender?.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {request.sender?.user_name ||
                          request.sender?.email?.split("@")[0] || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {request.sender?.email || "Unknown email"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptFriendRequest(request.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      <Check className="w-4 h-4" />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectFriendRequest(request.id)}
                      className="flex items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent Friend Requests */}
        {sentRequests.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">
              Sent Requests ({sentRequests.length})
            </h2>
            <div className="space-y-3">
              {sentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {request.receiver?.user_name
                        ? request.receiver.user_name.charAt(0).toUpperCase()
                        : request.receiver?.email?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {request.receiver?.user_name ||
                          request.receiver?.email?.split("@")[0] || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-400">
                        {request.receiver?.email || "Unknown email"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelSentRequest(request.id)}
                    className="text-red-500 hover:text-red-700 text-sm underline"
                  >
                    Cancel Request
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">
            Your Friends ({friends.length})
          </h2>
          {friends.length > 0 ? (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold">
                      {getDisplayName(friend).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {getDisplayName(friend)}
                      </p>
                      <p className="text-sm text-gray-400">{friend.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="text-red-500 hover:text-red-700 text-sm underline"
                  >
                    Remove Friend
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No friends yet. Search for users above to add friends!</p>
            </div>
          )}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
