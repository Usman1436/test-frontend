import ApolloProviderWrapper from '../lib/ApolloProvider';
import './globals.css'; // or any global styles you use

export const metadata = {
  title: 'My App',
  description: 'My App Description',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en">
      <body>
        <ApolloProviderWrapper>
          {children}
        </ApolloProviderWrapper>
      </body>
    </html>
  );
};

export default RootLayout;