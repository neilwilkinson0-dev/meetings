/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/webmail",
        destination: "https://webmail.contentdevelopment.org.uk",
        permanent: false,
      },
    ];
  },
};
export default nextConfig;
