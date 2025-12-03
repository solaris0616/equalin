'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@/lib/supabase/client';
import { getGroupMembers, getGroupPayments } from '@/app/actions/payments';
import type { Profile, PaymentWithDetails } from '@/types/payment';
import { PaymentForm } from './components/PaymentForm';
import { PaymentList } from './components/PaymentList';
import { SettlementDisplay } from './components/SettlementDisplay';
import { InviteLinkButton } from './components/InviteLinkButton';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function GroupPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const groupId = params.id;
  const storageKey = `equalin_profile_${groupId}`; // Key is now group-specific

  const [profile, setProfile] = useState<Profile | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load profile from localStorage
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

  // Fetch group members and payments when profile is loaded
  useEffect(() => {
    if (profile) {
      loadGroupData();
    }
  }, [profile, groupId]);

  const loadGroupData = async () => {
    setIsLoadingData(true);
    try {
      const [fetchedMembers, fetchedPayments] = await Promise.all([
        getGroupMembers(groupId),
        getGroupPayments(groupId),
      ]);
      setMembers(fetchedMembers);
      setPayments(fetchedPayments);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!nameInput.trim()) {
      alert('Please enter your name.');
      return;
    }

    const newProfile: Profile = { id: uuidv4(), name: nameInput.trim() };

    // Since a profile is unique to a user joining a group,
    // we can insert both profile and group_member.
    // A more robust solution might check if a profile with that name already exists for this group.

    // 1. Save to 'profiles' table
    const { error: profileError } = await supabase
      .from('profiles')
      .insert(newProfile);
    if (profileError) {
      console.error('Error saving profile:', profileError);
      alert('Could not save your profile. Please try again.');
      return;
    }

    // 2. Save to 'group_members' table
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, profile_id: newProfile.id });
    if (memberError) {
      console.error('Error joining group:', memberError);
      alert('Could not join the group. Please try again.');
      return;
    }

    // 3. Save profile to localStorage for this specific group and update state
    localStorage.setItem(storageKey, JSON.stringify(newProfile));
    setProfile(newProfile);
  };

  const handlePaymentSuccess = async () => {
    // Refresh payments and members after successful payment creation
    await loadGroupData();
    // Hide the payment form
    setShowPaymentForm(false);
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Group Expenses
          </h1>
          <p className="text-gray-600 mb-4">
            Welcome, <span className="font-bold">{profile.name}</span>!
          </p>

          {/* Invite Link */}
          <InviteLinkButton groupId={groupId} />
        </div>

        {/* Add Payment Button/Form */}
        <div>
          <button
            onClick={() => setShowPaymentForm(!showPaymentForm)}
            className="w-full md:w-auto px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition flex items-center justify-center gap-2"
          >
            {showPaymentForm ? (
              <>
                <ChevronUp className="w-5 h-5" />
                Hide Payment Form
              </>
            ) : (
              <>
                <ChevronDown className="w-5 h-5" />
                Add New Payment
              </>
            )}
          </button>

          {showPaymentForm && (
            <div className="mt-4">
              {isLoadingData ? (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-600">Loading members...</p>
                </div>
              ) : (
                <PaymentForm
                  groupId={groupId}
                  currentUserId={profile.id}
                  members={members}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </div>
          )}
        </div>

        {/* Payment List */}
        {isLoadingData ? (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <p className="text-gray-600">Loading payments...</p>
          </div>
        ) : (
          <PaymentList payments={payments} />
        )}

        {/* Settlement Display */}
        <SettlementDisplay groupId={groupId} />
      </div>
    </div>
  );
}
