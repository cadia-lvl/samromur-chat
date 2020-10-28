import * as React from 'react';
import styled from 'styled-components';
import {
    withRouter,
    RouteComponentProps
} from "react-router-dom";

import Layout from '../ui/layout';

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 30rem;
    max-width: 100%;
    gap: 1.5rem;
`;

type Props = RouteComponentProps & LegalDocProps;

interface ParagraphProps {
    text: Array<any>;
}

interface LegalDocProps {
    contents: Array<any>;
}

class ParagraphsWithLinks extends React.Component<ParagraphProps> {
    ParseParagraph() {
        return this.props.text.map ((phrase) => {
            if (Array.isArray(phrase)) {
                return phrase.map((phrase) => {
                    return ( <a href={phrase.link}>{phrase.text}</a>);})
            } else {
                return phrase;
            }
        })
    }
    render() {
        return (<p> { this.ParseParagraph() }</p>)
    }
}

class Paragraphs extends React.Component<ParagraphProps> {
    ParseParagraphs() {
        return this.props.text.map ((paragraph) => {
            if (Array.isArray(paragraph)) {
                return ( <ParagraphsWithLinks text={ paragraph }/> );
            } else {
                return (<p>{paragraph}</p>);
            }
        })
    }
    render() {
        return (<div> { this.ParseParagraphs() }</div>)
    }
}

class LegalDoc extends React.Component<Props> {
    DisplayArticles(articles) {
        return articles.map ((article) => {
            return (
                <>
                    <h3> { article.heading } </h3>
                    <Paragraphs text= { article.paragraphs } />
                </>
            )
        })
    }

    DisplayDocument() {
        return this.props.contents.map( (data) => {
            return (
                <div>
                    <h2> { data.title } </h2>
                    <p> { data.date } </p>
                    <Paragraphs text= { data.description } />
                    { this.DisplayArticles(data.articles) }
                </div>
            )
        })
    }

    render() {
        return (
            <Layout>
                <TextContainer>
                    {this.DisplayDocument() }
                </TextContainer>
            </Layout>
        );
    }
}

export default withRouter(LegalDoc);
