import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format, parseISO } from 'date-fns';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Link from 'next/link';

import { Header } from '../../components/Header';
import { Comments } from '../../components/Comments';
import { ButtonPreview } from '../../components/ButtonPreview';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useState } from 'react';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  preview: boolean;
  nextPost: Post | null;
  prevPost: Post | null;
  post: Post;
}

export default function Post({ preview, nextPost, prevPost, post }: PostProps) {
  console.log(post);

  const [publication, setPublication] = useState({
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
      banner: {
        url: post.data.banner.url,
      },
      author: post.data.author,
      content: post.data.content.map(content => ({
        heading: content.heading,
        body: [
          {
            text: RichText.asHtml(content.body),
          },
        ],
      })),
    },
  });
  const [estimatedReadingTime, setEstimatedReadingTime] = useState<number>();
  const router = useRouter();

  useEffect(() => {
    const eachContentSize = post.data.content.map(post => {
      const heading = post.heading.split(' ');
      const body = RichText.asText(post.body).split(' ');

      return heading.length + body.length;
    });

    const totalContentSize = eachContentSize.reduce((acc, total) => {
      return acc + total;
    }, 0);

    const estimatedReadingTime = Math.ceil(totalContentSize / 200);

    setEstimatedReadingTime(estimatedReadingTime);
  }, []);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>
      <Header />
      <main className={styles.postContainer}>
        <img src={publication.data.banner.url} alt={publication.data.title} />
        <div
          className={`${commonStyles.contentContainer} ${styles.postContent}`}
        >
          <h1>{publication.data.title}</h1>
          <div>
            <span>
              <FiCalendar />
              {publication.first_publication_date}
            </span>
            <span>
              <FiUser />
              {publication.data.author}
            </span>
            <span>
              <FiClock />
              {estimatedReadingTime} min
            </span>
          </div>
          <section>
            {publication.data.content.map(content => (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                {content.body.map(body => (
                  <div
                    key={body.text}
                    dangerouslySetInnerHTML={{ __html: body.text }}
                  ></div>
                ))}
              </article>
            ))}
          </section>
          <hr />

          <article className={styles.changePagePost}>
            {prevPost && (
              <div>
                <p>{prevPost.data.title}</p>
                <Link href={`/post/${prevPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {nextPost && (
              <div>
                <p>{nextPost.data.title}</p>
                <Link href={`/post/${nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}
          </article>

          <Comments />

          {preview && <ButtonPreview />}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  // TODO
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    lang: 'pt-BR',
    ref: previewData?.ref ?? null,
  });

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date]',
      after: response.id,
    }
  );

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      orderings: '[document.first_publication_date desc]',
      after: response.id,
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => ({
        heading: content.heading,
        body: content.body,
      })),
    },
  };

  // text: RichText.asHtml(content.body),

  return {
    props: {
      preview,
      nextPost: nextPost.results[0] ?? null,
      prevPost: prevPost.results[0] ?? null,
      post,
    },
    revalidate: 60 * 5, // 5 minutes
  };

  // TODO
};
