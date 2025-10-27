"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { v4 as uuidv4 } from "uuid";

type Profile = {
  id: string;
  name: string;
};

export default function GroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const groupId = params.id;
  const storageKey = `equalin_profile_${groupId}`; // Key is now group-specific

  const [profile, setProfile] = useState<Profile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileForGroup = () => {
      const localProfile = localStorage.getItem(storageKey);
      if (localProfile) {
        setProfile(JSON.parse(localProfile));
      }
      setIsLoading(false);
    };
    loadProfileForGroup();
  }, [groupId, storageKey]);

  const handleJoinGroup = async () => {
    if (!nameInput.trim()) {
      alert("Please enter your name.");
      return;
    }

    const newProfile: Profile = { id: uuidv4(), name: nameInput.trim() };

    // Since a profile is unique to a user joining a group,
    // we can insert both profile and group_member.
    // A more robust solution might check if a profile with that name already exists for this group.

    // 1. Save to 'profiles' table
    const { error: profileError } = await supabase
      .from("profiles")
      .insert(newProfile);
    if (profileError) {
      console.error("Error saving profile:", profileError);
      alert("Could not save your profile. Please try again.");
      return;
    }

    // 2. Save to 'group_members' table
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({ group_id: groupId, profile_id: newProfile.id });
    if (memberError) {
      console.error("Error joining group:", memberError);
      alert("Could not join the group. Please try again.");
      return;
    }

    // 3. Save profile to localStorage for this specific group and update state
    localStorage.setItem(storageKey, JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Join this Group
          </h2>
          <p className="text-center text-gray-600">
            Set your name for this group.
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleJoinGroup}
              className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If profile is set for this group, show the main content
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">
        Group: <span className="font-mono text-lg">{groupId}</span>
      </h1>
      <p className="text-xl">
        Welcome, <span className="font-bold">{profile.name}</span>!
      </p>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">Next Step:</h2>
        <p>Implement the payment form and list.</p>
      </div>
    </div>
  );
}
