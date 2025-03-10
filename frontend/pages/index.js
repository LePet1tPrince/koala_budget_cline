import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Koala Budget - Home</title>
        <meta name="description" content="Koala Budget application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>Koala Budget</span>
        </h1>

        <p className={styles.description}>
          Take control of your finances with our simple budgeting app
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Easy Tracking &rarr;</h2>
            <p>Track your income and expenses with an intuitive interface.</p>
          </div>

          <div className={styles.card}>
            <h2>Budget Planning &rarr;</h2>
            <p>Create and manage budgets for different categories.</p>
          </div>

          <div className={styles.card}>
            <h2>Visualize Growth &rarr;</h2>
            <p>See your financial progress with beautiful charts and reports.</p>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <Link href="/login">
            <button className={styles.button}>Login</button>
          </Link>
          <Link href="/signup">
            <button className={styles.buttonOutline}>Sign Up</button>
          </Link>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Koala Budget. All rights reserved.</p>
      </footer>
    </div>
  );
}
