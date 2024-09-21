'use client'

import { fetchPosts } from "@/services/hashnode";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import { FormattedDate } from "./FormattedDate";
import { Post } from "@/services/hashnode";
import { img } from "./mdx";
import Image from "next/image";

export default function Posts() {
    const { isPending, isError, data, error } = useQuery({
        queryKey: ['todos'],
        queryFn: async () => {
            let posts = await fetchPosts(1, 1);
            
            if(posts) {
                return posts.me.posts.nodes;
            } else {
                return null;
            }
        },
    });
    
    if(isPending) {
        return(
            <div>
                <h2>Loading...</h2>
            </div>
        );
    }

    if(isError) {
        console.log(error);
        return(
            <div>
                <h2>Error loading content. Please try again later.</h2>
            </div>
        );    
    }

    return(
        <div>
            {data?.map((post) => (
                <div>
                    <img alt={`cover image for ${post.title}`} src={post.coverImage.url}/>
                    <h2>{post.title}</h2>
                    <div dangerouslySetInnerHTML={{
                        __html: post.content.html
                    }}>
                    </div>
                </div>
            ))}
        </div>
    );
}