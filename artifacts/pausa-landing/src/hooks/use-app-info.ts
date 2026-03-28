import { useQuery } from "@tanstack/react-query";

export interface AppInfo {
  version: string;
  size: string;
  releaseDate: string;
  downloadUrl: string;
}

// UPDATE THIS URL to point to your actual APK file once uploaded.
// Place the APK in artifacts/pausa-landing/public/ and set the filename here.
const APK_DOWNLOAD_URL = "/pausa-v0.1.0-alpha.apk";
const APK_VERSION = "v0.1.0-alpha";
const APK_SIZE = "24.5 MB";

export function useAppInfo() {
  return useQuery({
    queryKey: ["app-info"],
    queryFn: async (): Promise<AppInfo> => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return {
        version: APK_VERSION,
        size: APK_SIZE,
        releaseDate: "2026-03-28",
        downloadUrl: APK_DOWNLOAD_URL,
      };
    },
    staleTime: 1000 * 60 * 60,
  });
}
