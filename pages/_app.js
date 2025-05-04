import '@/styles/globals.css'
import Head from 'next/head'
import { LanguageProvider } from '../context/LanguageContext'

export default function App({ Component, pageProps }) {
  return <>
    <Head>
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <LanguageProvider>
      <Component {...pageProps} />
    </LanguageProvider>
  </>
}
