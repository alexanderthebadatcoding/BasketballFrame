import { getFrameMetadata } from "frog/next";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const url = process.env.VERCEL_URL || "http://localhost:3000";
  const frameMetadata = await getFrameMetadata(`${url}/api`);
  return {
    other: frameMetadata,
  };
}

// Define your React component
const Page = () => {
  return (
    <div>
      <h1>NCAA Basketball in a frame</h1>
      {/* Other content goes here */}
    </div>
  );
};

// Export the component
export default Page;
