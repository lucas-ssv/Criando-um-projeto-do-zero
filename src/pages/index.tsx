import { GetStaticProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState({
    next_page: postsPagination.next_page,
    results: postsPagination.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          parseISO(post.first_publication_date),
          'dd MMM uuuu',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    }),
  });

  async function loadMorePosts() {
    if (!posts.next_page) return;

    const loadPosts = await fetch(posts.next_page).then(response =>
      response.json()
    );

    const post = loadPosts.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          parseISO(post.first_publication_date),
          'dd MMM uuuu',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts({
      next_page: loadPosts.next_page,
      results: [...posts.results, ...post],
    });
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <main className={commonStyles.contentContainer}>
        <Link href="/">
          <a>
            <img src="/images/logo.svg" alt="Spacetraveling" />
          </a>
        </Link>

        <section className={styles.contentPosts}>
          {posts.results.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <div className={styles.events}>
                  <span>
                    <FiCalendar />
                    {post.first_publication_date}
                  </span>
                  <span>
                    <FiUser />
                    {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}

          {posts.next_page && (
            <button type="button" onClick={loadMorePosts}>
              Carregar mais posts
            </button>
          )}
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query('', { pageSize: 1 });

  const post = {
    next_page: postsResponse.next_page,
    results: postsResponse.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    }),
  };

  // TODO
  return {
    props: {
      postsPagination: post,
    },
  };
};
