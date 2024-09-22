import { gql, request } from 'graphql-request';

const hashnodePosts = gql`
    query Me($pageSize: Int!, $page: Int!) {
        me {
            posts(pageSize: $pageSize, page: $page, sortBy: DATE_PUBLISHED_DESC, filter: null) {
            nodes {
                id
                subtitle
                title
                updatedAt
                content {
                    markdown
                }
                publishedAt
                coverImage {
                    url
                }
            }
            }
        }
    }
`;

const requestHeaders = {
    "Authorization": "b2554b5a-fb76-46da-a854-d2bf5049d706"
};

type Data = {
    me: {
        posts: {
            nodes: Post[]
        }
    }
};

export type Post = {
    id: string,
    subtitle: string | null,
    title: string,
    updatedAt: string | null,
    content: {
        markdown: string
    },
    publishedAt: string,
    coverImage: {
        url: string
    }
};

export const fetchPosts = async (pageSize: number, page: number): Promise<Data | null> => {
    return request(
        'https://gql.hashnode.com',
        hashnodePosts,
        {
            pageSize: 1,
            page: 1
        },
        requestHeaders
    );
};