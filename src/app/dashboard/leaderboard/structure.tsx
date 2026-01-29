"use client";

import { useState, useEffect, useRef } from "react";
import { Session } from "next-auth";
import {
  Search,
  UserPlus,
  Check,
  X,
  Trophy,
  Users,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  Medal,
  Crown,
} from "lucide-react";
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
  hasSentRequest?: boolean;
}

export function Structure({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: Session["user"];
}) {
  const [activeTab, setActiveTab] = useState<"global" | "friends">("global");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<User[]>([]);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.user_id) {
      fetchFriends();
      fetchPendingRequests();
      fetchSentRequests();
      fetchGlobalLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchGlobalLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard?limit=20");
      if (res.ok) {
        const data = await res.json();
        setGlobalLeaderboard(data.users || []);
      }
    } catch (err) {
      console.error("Error fetching global leaderboard:", err);
    }
  };

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
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (res.ok) {
        const data = await res.json();

        const filteredResults = (data.users || [])
          .filter((u: User) => u.id !== user?.user_id)
          .map((u: User) => ({
            ...u,
            isFriend: friends.some((f) => f.id === u.id),
            isPending: pendingRequests.some((pr) => pr.sender_id === u.id),
            hasSentRequest: sentRequests.some((sr) => sr.receiver_id === u.id),
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
        setSearchResults((prev) =>
          prev.map((r) =>
            r.id === receiverId ? { ...r, hasSentRequest: true } : r
          )
        );
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
        if (activeTab === "friends") {
          fetchGlobalLeaderboard();
        }
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

  const totalPending = pendingRequests.length + sentRequests.length;

  const friendsLeaderboard = [...friends].sort(
    (a, b) => (b.wallet || 0) - (a.wallet || 0)
  );

  return (
    <div className="shadcn dark min-h-scree">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Leaderboard
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Top traders by wallet balance
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800 focus-within:border-zinc-600 transition-all w-64">
                <Search className="h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="bg-transparent outline-none text-white w-full placeholder-zinc-500 text-sm"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() =>
                    searchQuery.trim().length >= 2 && setShowResults(true)
                  }
                />
              </div>

              {showResults && searchResults.length > 0 && (
                <div className="absolute mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 max-h-96 overflow-y-auto shadow-2xl z-50 right-0">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 hover:bg-zinc-800 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                          {getDisplayName(result).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {getDisplayName(result)}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {result.email}
                          </p>
                        </div>
                      </div>
                      <div>
                        {result.isFriend ? (
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                            Friends
                          </span>
                        ) : result.isPending ? (
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                            Pending
                          </span>
                        ) : result.hasSentRequest ? (
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-1 rounded-full">
                            Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => sendFriendRequest(result.id)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showResults && searchResults.length === 0 && !isSearching && (
                <div className="absolute mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center text-zinc-500 right-0">
                  No users found
                </div>
              )}
            </div>

            {/* Friends Button */}
            <button
              onClick={() => setShowFriendModal(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition border border-zinc-800"
            >
              <Users className="w-4 h-4" />
              <span className="text-sm">Friends</span>
              {totalPending > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs rounded-full flex items-center justify-center font-medium">
                  {totalPending}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-900 rounded-full w-fit border border-zinc-800">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "global"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Global
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === "friends"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            Friends
          </button>
        </div>

        {/* Global Leaderboard */}
        {activeTab === "global" && (
          <div className="space-y-2">
            {globalLeaderboard.map((leaderUser, index) => {
              const rank = index + 1;
              const isCurrentUser = leaderUser.id === user?.user_id;
              const isFriend = friends.some((f) => f.id === leaderUser.id);

              return (
                <div
                  key={leaderUser.id}
                  className={`flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 transition hover:bg-zinc-900/50 ${
                    isCurrentUser ? "bg-zinc-900" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8">
                      {rank === 1 ? (
                        <Crown className="w-5 h-5 text-yellow-400" />
                      ) : rank === 2 ? (
                        <Medal className="w-5 h-5 text-gray-300" />
                      ) : rank === 3 ? (
                        <Medal className="w-5 h-5 text-amber-600" />
                      ) : (
                        <span className="text-zinc-500 font-medium text-sm">
                          {rank}
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                      {getDisplayName(leaderUser).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {getDisplayName(leaderUser)}
                        </p>
                        {isCurrentUser && (
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        {isFriend && !isCurrentUser && (
                          <span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                            Friend
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">
                        {leaderUser.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-medium text-green-500">
                      ₹{leaderUser.wallet?.toLocaleString() || 0}
                    </p>
                    {!isCurrentUser && !isFriend && (
                      <button
                        onClick={() => sendFriendRequest(leaderUser.id)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Friends Leaderboard */}
        {activeTab === "friends" && (
          <div className="space-y-2">
            {friendsLeaderboard.length > 0 ? (
              friendsLeaderboard.map((friend, index) => {
                const rank = index + 1;
                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-800/50 transition hover:bg-zinc-900/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8">
                        {rank === 1 ? (
                          <Crown className="w-5 h-5 text-yellow-400" />
                        ) : rank === 2 ? (
                          <Medal className="w-5 h-5 text-gray-300" />
                        ) : rank === 3 ? (
                          <Medal className="w-5 h-5 text-amber-600" />
                        ) : (
                          <span className="text-zinc-500 font-medium text-sm">
                            {rank}
                          </span>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                        {getDisplayName(friend).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {getDisplayName(friend)}
                        </p>
                        <p className="text-xs text-zinc-500">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-green-500">
                        ₹{friend.wallet?.toLocaleString() || 0}
                      </p>
                      <button
                        onClick={() => removeFriend(friend.id)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Users className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No Friends Yet
                </h3>
                <p className="text-zinc-500 mb-6">
                  Add friends to see them on your leaderboard
                </p>
                <button
                  onClick={() => setActiveTab("global")}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full transition border border-zinc-800"
                >
                  Find Friends
                </button>
              </div>
            )}
          </div>
        )}

        {/* Friend Modal */}
        {showFriendModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Friends</h2>
                <button
                  onClick={() => setShowFriendModal(false)}
                  className="p-2 hover:bg-zinc-900 rounded-full transition"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Incoming */}
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">
                      Incoming ({pendingRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                              {request.sender?.user_name
                                ? request.sender.user_name
                                    .charAt(0)
                                    .toUpperCase()
                                : request.sender?.email
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {request.sender?.user_name ||
                                  request.sender?.email?.split("@")[0]}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {request.sender?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => acceptFriendRequest(request.id)}
                              className="p-2 bg-zinc-800 text-green-500 rounded-full hover:bg-zinc-700 transition"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(request.id)}
                              className="p-2 bg-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-700 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sent */}
                {sentRequests.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">
                      Sent ({sentRequests.length})
                    </h3>
                    <div className="space-y-2">
                      {sentRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                              {request.receiver?.user_name
                                ? request.receiver.user_name
                                    .charAt(0)
                                    .toUpperCase()
                                : request.receiver?.email
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {request.receiver?.user_name ||
                                  request.receiver?.email?.split("@")[0]}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {request.receiver?.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => cancelSentRequest(request.id)}
                            className="text-xs text-zinc-400 hover:text-white transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Friends */}
                {friends.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wider">
                      All Friends ({friends.length})
                    </h3>
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-white font-medium text-sm">
                              {getDisplayName(friend).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white text-sm">
                                {getDisplayName(friend)}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {friend.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-green-500">
                              ₹{friend.wallet?.toLocaleString() || 0}
                            </span>
                            <button
                              onClick={() => removeFriend(friend.id)}
                              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalPending === 0 && friends.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No friends or requests</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
