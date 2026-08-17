import React, { useState } from "react";
import { functions } from "../firebase";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";

export function useApparelVTO() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const tryOn = async (userPhotoUrl, clothingImageUrl, clothingInfo = {}) => {
    if (!user) {
      setError("Must be logged in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tryOnApparel = httpsCallable(functions, "tryOnApparel");
      const response = await tryOnApparel({
        userPhotoUrl,
        clothingImageUrl,
        clothingInfo,
      });

      setResult({
        ...response.data.result,
        outfitId: response.data.outfitId,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error("Apparel VTO error:", err);
      setError(err.message || "Failed to try on apparel");
    } finally {
      setLoading(false);
    }
  };

  return { loading, result, error, tryOn };
}
