import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "flickpick_device_id";

let cached: string | null = null;

function generateUUID(): string {
  // React Native compatible UUID v4 generation
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  if (Platform.OS === "web") {
    try {
      let id = localStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        id = typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : generateUUID();
        localStorage.setItem(DEVICE_ID_KEY, id);
      }
      cached = id;
      return id;
    } catch (e) {
      console.warn("[FlickPick] localStorage failed, using in-memory ID:", e);
      cached = generateUUID();
      return cached;
    }
  }

  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id = generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    cached = id;
    return id;
  } catch (e) {
    console.warn("[FlickPick] SecureStore failed, using in-memory ID:", e);
    cached = generateUUID();
    return cached;
  }
}
