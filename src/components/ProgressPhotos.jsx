import React, { useState, useEffect, useCallback } from "react";
import { db, storage } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * Progress Photos Component
 * Store before/after photo pairs with analyses
 * Gallery showing timeline of skin journey
 * Compare progress over time
 * Share transformations with privacy controls
 */
export function ProgressPhotos() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([null, null]); // [before, after]
  const [selectedVisibility, setSelectedVisibility] = useState("private"); // private, friends, public
  const [viewMode, setViewMode] = useState("gallery"); // gallery, compare
  const [compareIndices, setCompareIndices] = useState([0, photos.length - 1]);
  const { user } = useAuth();

  // Fetch user's progress photos
  const fetchPhotos = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    try {
      const q = query(
        collection(db, "progressPhotos"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);

      const userPhotos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));

      setPhotos(userPhotos);
    } catch (err) {
      console.error("Error fetching progress photos:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle photo upload
  const handlePhotoUpload = async (e, photoType) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      // Upload to Firebase Storage
      const photoRef = ref(
        storage,
        `progress-photos/${user.uid}/${Date.now()}-${photoType}-${file.name}`
      );
      await uploadBytes(photoRef, file);
      const photoUrl = await getDownloadURL(photoRef);

      setSelectedPhotos((prev) => {
        const updated = [...prev];
        updated[photoType === "before" ? 0 : 1] = {
          url: photoUrl,
          file: file.name,
          uploadedAt: new Date(),
        };
        return updated;
      });
    } catch (err) {
      console.error("Error uploading progress photo:", err);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Save progress photo pair
  const saveProgressPhotos = useCallback(async () => {
    if (!user || !selectedPhotos[0] || !selectedPhotos[1]) {
      alert("Please upload both before and after photos");
      return;
    }

    setUploading(true);

    try {
      const progressData = {
        userId: user.uid,
        beforePhoto: {
          url: selectedPhotos[0].url,
          uploadedAt: Timestamp.fromDate(selectedPhotos[0].uploadedAt),
        },
        afterPhoto: {
          url: selectedPhotos[1].url,
          uploadedAt: Timestamp.fromDate(selectedPhotos[1].uploadedAt),
        },
        visibility: selectedVisibility,
        createdAt: Timestamp.now(),
        caption: "",
        analysisComparison: null, // Can be filled with analysis data from API
      };

      await addDoc(collection(db, "progressPhotos"), progressData);

      // Reset form
      setSelectedPhotos([null, null]);
      setSelectedVisibility("private");

      // Refresh photos
      fetchPhotos();
      alert("Progress photos saved successfully!");
    } catch (err) {
      console.error("Error saving progress photos:", err);
      alert("Failed to save progress photos. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [user, selectedPhotos, selectedVisibility, fetchPhotos]);

  // Update photo visibility
  const updateVisibility = useCallback(
    async (photoId, visibility) => {
      try {
        await updateDoc(doc(db, "progressPhotos", photoId), {
          visibility,
          updatedAt: Timestamp.now(),
        });

        fetchPhotos();
      } catch (err) {
        console.error("Error updating photo visibility:", err);
      }
    },
    [fetchPhotos]
  );

  // Delete progress photo
  const deleteProgressPhoto = useCallback(
    async (photoId, beforeUrl, afterUrl) => {
      if (!confirm("Delete this progress entry?")) return;

      try {
        // Delete from Firestore
        await deleteDoc(doc(db, "progressPhotos", photoId));

        // Delete from Storage
        try {
          await deleteObject(ref(storage, beforeUrl));
          await deleteObject(ref(storage, afterUrl));
        } catch (err) {
          console.warn("Failed to delete storage files:", err);
        }

        fetchPhotos();
      } catch (err) {
        console.error("Error deleting progress photo:", err);
      }
    },
    [fetchPhotos]
  );

  // Share transformation
  const shareTransformation = useCallback((photo) => {
    const text = `My 6-month skin transformation on AinaAi! Check out my progress. 📸💪`;
    if (navigator.share) {
      navigator.share({ title: "My Skin Transformation", text });
    } else {
      navigator.clipboard.writeText(text);
      alert("Share text copied to clipboard!");
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [user, fetchPhotos]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold mb-6 text-gray-800">Progress Photos</h3>

      {/* View Mode Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setViewMode("gallery")}
          className={`px-4 py-2 font-medium transition ${
            viewMode === "gallery"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Gallery
        </button>
        <button
          onClick={() => setViewMode("compare")}
          className={`px-4 py-2 font-medium transition ${
            viewMode === "compare"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Compare
        </button>
        <button
          onClick={() => setViewMode("upload")}
          className={`px-4 py-2 font-medium transition ${
            viewMode === "upload"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Upload New
        </button>
      </div>

      {/* Upload Mode */}
      {viewMode === "upload" && (
        <div className="space-y-6 mb-8 pb-8 border-b border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Before Photo
            </label>
            <div className="flex items-center gap-4">
              {selectedPhotos[0] ? (
                <div className="flex-1">
                  <img
                    src={selectedPhotos[0].url}
                    alt="Before"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPhotos[0].file}
                  </p>
                </div>
              ) : (
                <div className="flex-1 bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                  No photo selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, "before")}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              After Photo
            </label>
            <div className="flex items-center gap-4">
              {selectedPhotos[1] ? (
                <div className="flex-1">
                  <img
                    src={selectedPhotos[1].url}
                    alt="After"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPhotos[1].file}
                  </p>
                </div>
              ) : (
                <div className="flex-1 bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-500">
                  No photo selected
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, "after")}
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can see this?
            </label>
            <select
              value={selectedVisibility}
              onChange={(e) => setSelectedVisibility(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="private">Private (only me)</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>
          </div>

          <button
            onClick={saveProgressPhotos}
            disabled={uploading || !selectedPhotos[0] || !selectedPhotos[1]}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition min-h-[48px] flex items-center justify-center"
            aria-busy={uploading}
          >
            {uploading ? "Saving..." : "Save Progress"}
          </button>
        </div>
      )}

      {/* Gallery Mode */}
      {viewMode === "gallery" && (
        <div>
          {loading ? (
            <LoadingSpinner />
          ) : photos.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No progress photos yet. Upload your first before/after pair!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-1">
                    <div className="relative">
                      <img
                        src={photo.beforePhoto.url}
                        alt="Before"
                        className="w-full h-48 object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        Before
                      </span>
                    </div>
                    <div className="relative">
                      <img
                        src={photo.afterPhoto.url}
                        alt="After"
                        className="w-full h-48 object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        After
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      {new Date(photo.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Visibility: {photo.visibility}
                    </p>

                    <div className="flex gap-2 mt-4">
                      <select
                        value={photo.visibility}
                        onChange={(e) =>
                          updateVisibility(photo.id, e.target.value)
                        }
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none"
                      >
                        <option value="private">Private</option>
                        <option value="friends">Friends</option>
                        <option value="public">Public</option>
                      </select>

                      <button
                        onClick={() => shareTransformation(photo)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Share
                      </button>

                      <button
                        onClick={() =>
                          deleteProgressPhoto(
                            photo.id,
                            photo.beforePhoto.url,
                            photo.afterPhoto.url
                          )
                        }
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Compare Mode */}
      {viewMode === "compare" && (
        <div>
          {photos.length < 2 ? (
            <p className="text-center text-gray-500 py-8">
              Need at least 2 progress entries to compare
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select entries to compare
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Earlier</p>
                    <select
                      value={compareIndices[0]}
                      onChange={(e) =>
                        setCompareIndices([parseInt(e.target.value), compareIndices[1]])
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {photos.map((photo, idx) => (
                        <option key={photo.id} value={idx}>
                          {new Date(photo.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Recent</p>
                    <select
                      value={compareIndices[1]}
                      onChange={(e) =>
                        setCompareIndices([compareIndices[0], parseInt(e.target.value)])
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {photos.map((photo, idx) => (
                        <option key={photo.id} value={idx}>
                          {new Date(photo.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {photos[compareIndices[0]] && photos[compareIndices[1]] && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 text-center">
                      {new Date(photos[compareIndices[0]].createdAt).toLocaleDateString()}
                    </h4>
                    <img
                      src={photos[compareIndices[0]].afterPhoto.url}
                      alt="Earlier"
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2 text-center">
                      {new Date(photos[compareIndices[1]].createdAt).toLocaleDateString()}
                    </h4>
                    <img
                      src={photos[compareIndices[1]].afterPhoto.url}
                      alt="Recent"
                      className="w-full rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
