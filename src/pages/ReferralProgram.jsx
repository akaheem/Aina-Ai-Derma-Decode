import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

/**
 * Referral Program Page
 * Users generate unique referral codes
 * Track referred users and rewards
 * Referred users get 20% discount on premium
 * Original user gets free premium month after 3 referrals
 */
export function ReferralProgram() {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [rewards, setRewards] = useState({
    totalReferrals: 0,
    freePremiumMonths: 0,
    nextMilestone: 0, // 3, 6, 9, etc.
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();

  // Generate unique referral code
  const generateReferralCode = useCallback(async () => {
    if (!user) return;

    try {
      // Check if user already has a referral code
      const q = query(
        collection(db, "referralCodes"),
        where("userId", "==", user.uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.docs.length > 0) {
        setReferralCode(snapshot.docs[0].data().code);
        return;
      }

      // Generate new code: SKIN-[6 random chars]
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "SKIN-";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Save to Firestore
      await addDoc(collection(db, "referralCodes"), {
        userId: user.uid,
        code,
        email: user.email,
        createdAt: Timestamp.now(),
      });

      setReferralCode(code);
    } catch (err) {
      console.error("Error generating referral code:", err);
    }
  }, [user]);

  // Fetch user's referrals
  const fetchReferrals = useCallback(async () => {
    if (!user || !referralCode) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "referrals"),
        where("referrerCode", "==", referralCode)
      );
      const snapshot = await getDocs(q);

      const userReferrals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setReferrals(userReferrals);

      // Calculate rewards
      const totalReferrals = userReferrals.length;
      const freePremiumMonths = Math.floor(totalReferrals / 3);
      const nextMilestone = ((Math.floor(totalReferrals / 3) + 1) * 3);

      setRewards({
        totalReferrals,
        freePremiumMonths,
        nextMilestone,
      });
    } catch (err) {
      console.error("Error fetching referrals:", err);
    } finally {
      setLoading(false);
    }
  }, [user, referralCode]);

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    const link = `https://invite.aina-ai.com?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Share referral link
  const shareReferralLink = () => {
    const link = `https://invite.aina-ai.com?ref=${referralCode}`;
    const text = `Join me on AinaAi - your personal AI skincare advisor! Get 20% off premium with my code: ${referralCode}. ${link}`;

    if (navigator.share) {
      navigator.share({
        title: "Join AinaAi",
        text,
        url: link,
      });
    } else {
      navigator.clipboard.writeText(text);
      alert("Referral text copied to clipboard!");
    }
  };

  useEffect(() => {
    generateReferralCode();
  }, [user, generateReferralCode]);

  useEffect(() => {
    if (referralCode) {
      fetchReferrals();
    }
  }, [referralCode, fetchReferrals]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Referral Program</h2>
        <p className="text-gray-600">
          Invite friends and earn rewards. They get 20% off, you get free premium months.
        </p>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg shadow-md p-6 border border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-purple-900">Your Referral Code</h3>

        <div className="bg-white rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600 mb-2">Your unique code:</p>
          <p className="text-3xl font-bold text-purple-600 mb-4">
            {referralCode || "Generating..."}
          </p>

          <div className="space-y-3">
            <button
              onClick={copyReferralLink}
              className={`w-full px-4 py-3 rounded-lg font-medium transition min-h-[48px] flex items-center justify-center ${
                copied
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {copied ? "Copied!" : "Copy Referral Link"}
            </button>

            <button
              onClick={shareReferralLink}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition min-h-[48px] flex items-center justify-center"
            >
              Share with Friends
            </button>
          </div>
        </div>

        <div className="text-sm text-purple-800">
          <p className="font-semibold mb-2">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Friends use your code to get 20% off premium</li>
            <li>You get 1 free premium month per 3 referrals</li>
            <li>Rewards stack - earn unlimited premium months</li>
          </ul>
        </div>
      </div>

      {/* Rewards Progress */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Rewards</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700 mb-1">Total Referrals</p>
            <p className="text-3xl font-bold text-blue-600">
              {rewards.totalReferrals}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700 mb-1">Free Premium Months Earned</p>
            <p className="text-3xl font-bold text-green-600">
              {rewards.freePremiumMonths}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-700 mb-1">Next Milestone</p>
            <p className="text-3xl font-bold text-purple-600">
              {rewards.nextMilestone}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Referrals until next month
            </p>
            <p className="text-sm font-medium text-gray-700">
              {Math.max(0, rewards.nextMilestone - rewards.totalReferrals)} / 3
            </p>
          </div>

          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
              style={{
                width: `${Math.min(100, ((rewards.totalReferrals % 3) / 3) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Your Referrals ({referrals.length})
        </h3>

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading referrals...</p>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No referrals yet. Start inviting friends!</p>
            <button
              onClick={shareReferralLink}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition min-h-[48px]"
            >
              Invite Friends
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Friend
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Discount
                  </th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">
                          {referral.friendEmail}
                        </p>
                        {referral.friendName && (
                          <p className="text-xs text-gray-500">{referral.friendName}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          referral.premiumActive
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {referral.premiumActive ? "Active Premium" : "Using Discount"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {referral.discountApplied ? "20% Off" : "Pending"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-gray-50 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">FAQ</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              How much discount do my friends get?
            </h4>
            <p className="text-gray-700 text-sm">
              Friends get 20% off premium when they use your referral code at signup or checkout.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">When do I get rewarded?</h4>
            <p className="text-gray-700 text-sm">
              You earn 1 free premium month for every 3 successful referrals. Rewards are applied
              instantly to your account.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Can I use premium months and discounts together?
            </h4>
            <p className="text-gray-700 text-sm">
              Premium months are applied to your account first. After they expire, you can use a
              discount code if available.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Is there a limit to how many friends I can refer?
            </h4>
            <p className="text-gray-700 text-sm">
              No limit! Refer as many friends as you want and earn unlimited free premium months.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
