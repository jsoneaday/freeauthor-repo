export function arrayBufferToBase64(arrayBuffer: ArrayBuffer | undefined) {
  if (!arrayBuffer) return "";

  let binary = "";
  const blob = new Blob([arrayBuffer]);
  const url = URL.createObjectURL(blob);
  console.log("url", url);
  return url;
}
