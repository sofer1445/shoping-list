
import { useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useListOperations } from "./useListOperations";

export const useListInitialization = () => {
  const [hasAttemptedInitialFetch, setHasAttemptedInitialFetch] = useState(false);
  const { user } = useAuth();
  const { createNewList, fetchExistingList } = useListOperations(user);

  const createInitialList = useCallback(async () => {
    if (!user || hasAttemptedInitialFetch) {
      console.log("Skipping initial list creation:", { 
        hasUser: !!user, 
        hasAttemptedInitialFetch 
      });
      return;
    }

    setHasAttemptedInitialFetch(true);

    try {
      console.log("Attempting to fetch existing list");
      const existingListId = await fetchExistingList();
      
      if (existingListId) {
        console.log("Found existing list:", existingListId);
        return existingListId;
      }

      console.log("No existing list found, creating new list");
      const newListId = await createNewList();
      if (newListId) {
        console.log("Created new list:", newListId);
        return newListId;
      } else {
        console.error("Failed to create new list - no ID returned");
        return null;
      }
    } catch (error) {
      console.error("Detailed error in createInitialList:", {
        error,
        stack: error.stack,
        context: { userId: user?.id }
      });
      throw error;
    }
  }, [user, hasAttemptedInitialFetch, createNewList, fetchExistingList]);

  return {
    createInitialList,
    hasAttemptedInitialFetch
  };
};
