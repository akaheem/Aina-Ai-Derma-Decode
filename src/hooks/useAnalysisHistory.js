import React, { useState, useEffect, useCallback } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useAnalysisHistory() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const { user } = useAuth();

  const BATCH_SIZE = 10;
  const DAYS_LIMIT = 90;

  const fetchAnalyses = useCallback(
    async (isLoadMore = false) => {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Calculate date limit (90 days ago)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - DAYS_LIMIT);

        let q;
        if (isLoadMore && lastDoc) {
          q = query(
            collection(db, "analyses"),
            where("userId", "==", user.uid),
            where("timestamp", ">=", Timestamp.fromDate(dateLimit)),
            orderBy("timestamp", "desc"),
            startAfter(lastDoc),
            limit(BATCH_SIZE)
          );
        } else {
          q = query(
            collection(db, "analyses"),
            where("userId", "==", user.uid),
            where("timestamp", ">=", Timestamp.fromDate(dateLimit)),
            orderBy("timestamp", "desc"),
            limit(BATCH_SIZE)
          );
        }

        const snapshot = await getDocs(q);
        const newAnalyses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate?.() || new Date(),
        }));

        if (isLoadMore) {
          setAnalyses((prev) => [...prev, ...newAnalyses]);
        } else {
          setAnalyses(newAnalyses);
        }

        setHasMore(newAnalyses.length === BATCH_SIZE);
        if (newAnalyses.length > 0) {
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
      } catch (err) {
        console.error("Error fetching analyses:", err);
        setError(err.message || "Failed to load analysis history");
      } finally {
        setLoading(false);
      }
    },
    [user, lastDoc]
  );

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchAnalyses(true);
    }
  }, [hasMore, loading, fetchAnalyses]);

  return {
    analyses,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => {
      setLastDoc(null);
      fetchAnalyses();
    },
  };
}
