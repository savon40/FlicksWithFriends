import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "flickpick_device_id";

let cached: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;

  if (Platform.OS === "web") {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    cached = id;
    return id;
  }

  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  cached = id;
  return id;
}
