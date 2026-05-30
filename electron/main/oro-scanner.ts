import fs from 'fs';


export const deleteFileIfExists = (filePath: string) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${filePath}`);
  }
};
