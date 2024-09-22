'use client'

import { fetchPosts } from "@/services/hashnode";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from 'react-markdown';
import Img from "./Img";
import remarkGfm from "remark-gfm";

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
                <div key={post.id}>
                    <Img alt={`cover image for ${post.title}`} src={post.coverImage.url} width={1200} height={800}/>
                    <h2>{post.title}</h2>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            img: (props) => (
                                <Img src={props.src!} alt={props.alt!} width={1200} height={800}></Img>
                            )
                        }}>
                        {post.content.markdown.replaceAll(' align="center"', '')}
                    </ReactMarkdown>
                </div>
            ))}
        </div>
    );
}