import * as React from 'react';
import styled from 'styled-components';
import { withRouter, RouteComponentProps } from 'react-router-dom';

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

interface PhraseLinkProps {
    item: { link: string; text: string };
}

class PhraseLink extends React.Component<PhraseLinkProps> {
    render() {
        return <a href={this.props.item.link}>{this.props.item.text}</a>;
    }
}

class ParagraphsWithLinks extends React.Component<ParagraphProps> {
    ParseParagraph() {
        return this.props.text.map((phrase) => {
            if (Array.isArray(phrase)) {
                return phrase.map((phrase) => (
                    <PhraseLink key={phrase.text} item={phrase} />
                ));
            } else {
                return phrase;
            }
        });
    }
    render() {
        return <p> {this.ParseParagraph()}</p>;
    }
}

class Paragraphs extends React.Component<ParagraphProps> {
    ParseParagraphs() {
        return this.props.text.map((paragraph) => {
            if (Array.isArray(paragraph)) {
                return <ParagraphsWithLinks text={paragraph} />;
            } else {
                return <p>{paragraph}</p>;
            }
        });
    }
    render() {
        return <div> {this.ParseParagraphs()}</div>;
    }
}

class LegalDoc extends React.Component<Props> {
    DisplayArticles(articles: Array<any>) {
        return articles.map((article) => {
            return (
                <div key={article.heading}>
                    <h3> {article.heading} </h3>
                    <Paragraphs text={article.paragraphs} />
                </div>
            );
        });
    }

    DisplayDocument() {
        return this.props.contents.map((data) => {
            return (
                <div key={data.title}>
                    <h2> {data.title} </h2>
                    <p> {data.date} </p>
                    <Paragraphs text={data.description} />
                    {this.DisplayArticles(data.articles)}
                </div>
            );
        });
    }

    render() {
        return (
            <Layout>
                <TextContainer>{this.DisplayDocument()}</TextContainer>
            </Layout>
        );
    }
}

export default withRouter(LegalDoc);
