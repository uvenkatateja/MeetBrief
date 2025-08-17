import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from '@clerk/nextjs/server';
 
const f = createUploadthing();
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  transcriptUploader: f({
    "application/pdf": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB" },
    "application/msword": { maxFileSize: "16MB" },
    "text/plain": { maxFileSize: "4MB" },
    "audio/mpeg": { maxFileSize: "32MB" },
    "audio/wav": { maxFileSize: "32MB" },
    "audio/mp4": { maxFileSize: "32MB" },
    "video/mp4": { maxFileSize: "64MB" },
  })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const { userId } = await auth();
 
      // If you throw, the user will not be able to upload
      if (!userId) throw new UploadThingError("Unauthorized");
 
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.ufsUrl || file.url); // Use ufsUrl for v9+
      console.log("File name:", file.name);
      console.log("File size:", file.size);
      
      // Call your webhook to process the file
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/upload-callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ufsUrl: file.ufsUrl || file.url, // Use ufsUrl for v9+
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            userId: metadata.userId,
            fileKey: file.key,
          }),
        });
      } catch (error) {
        console.error('Failed to call webhook:', error);
      }
 
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, fileUrl: file.ufsUrl || file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;
