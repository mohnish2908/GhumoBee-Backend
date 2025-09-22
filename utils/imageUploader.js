const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
const fs = require("fs");

exports.uploadImageToCloudinary = async (file, folder, type = "auto") => {
  const options = {
    folder,
    quality: "auto",
    timeout: 120000, // 2 minutes timeout
    resource_type: "auto",
  };

  console.log("File object received:", {
    name: file.name,
    size: file.size,
    mimetype: file.mimetype,
    hasData: !!file.data,
    dataLength: file.data ? file.data.length : 0,
    hasTempFilePath: !!file.tempFilePath
  });

  try {
    let imageBuffer;

    // Handle different file input sources
    if (file.data && file.data.length > 0) {
      console.log("Using direct file data");
      imageBuffer = file.data;
    } else if (file.tempFilePath) {
      console.log("Reading from temp file:", file.tempFilePath);
      imageBuffer = fs.readFileSync(file.tempFilePath);
    } else {
      throw new Error("No file data available - neither buffer nor temp file path");
    }

    // Optimize image with Sharp before uploading
    console.log("Processing image with Sharp...");
    
    // Determine Sharp quality based on type
    let sharpQuality;
    if (type === "profile") {
      sharpQuality = 85;
    } else if (type === "document") {
      sharpQuality = 90;
    } else {
      sharpQuality = 80;
    }

    // Convert to WebP format instead of JPEG
    const processedBuffer = await sharp(imageBuffer)
      .resize(1920, 1080, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ 
        quality: sharpQuality,
        effort: 4, // Compression effort (0-6, higher = better compression but slower)
        lossless: false // Set to true for lossless compression
      })
      .toBuffer();

    console.log(`Image processed to WebP. Original size: ${imageBuffer.length}, Processed size: ${processedBuffer.length}`);

    // Upload to Cloudinary with retry logic
    let uploadResult;
    let retries = 3;
    
    while (retries > 0) {
      try {
        console.log(`Attempting upload to Cloudinary (${4 - retries}/3)...`);
        
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          
          // Create a readable stream from buffer
          const { Readable } = require('stream');
          const bufferStream = new Readable();
          bufferStream.push(processedBuffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
        
        console.log("Upload successful (WebP):", uploadResult.secure_url);
        break; // Success, exit retry loop
        
      } catch (uploadError) {
        retries--;
        console.log(`Upload attempt failed (${3 - retries}/3):`, uploadError.message);
        
        if (retries === 0) {
          throw uploadError; // Re-throw if all retries exhausted
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
      }
    }

    // Clean up temp file if it exists
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      try {
        fs.unlinkSync(file.tempFilePath);
        console.log("Temp file cleaned up:", file.tempFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError.message);
      }
    }

    return uploadResult;

  } catch (error) {
    console.error("Image upload error:", error);
    
    // Clean up temp file on error
    if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
      try {
        fs.unlinkSync(file.tempFilePath);
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file on error:", cleanupError.message);
      }
    }
    
    throw error;
  }
};