import React from 'react';
import { render, screen } from '@testing-library/react';
import AuthCard from '../../components/AuthCard';

describe('components/AuthCard.js', () => {
    it('renders title, children, and bottomContent properly', () => {
        render(
            <AuthCard title="Test Title" bottomContent={<div>Bottom Content</div>}>
                <div>Child Content</div>
            </AuthCard>
        );

        expect(screen.getByText('Test Title')).toBeInTheDocument();
        expect(screen.getByText('Child Content')).toBeInTheDocument();
        expect(screen.getByText('Bottom Content')).toBeInTheDocument();
    });

    it('renders default hero content and new card container', () => {
        const { container } = render(
            <AuthCard title="Theme Test">Theme Child</AuthCard>
        );

        expect(screen.getAllByText('Secure Access').length).toBeGreaterThan(0);
        expect(container.querySelector('.ui-card')).toBeInTheDocument();
    });

    it('renders custom hero copy when provided', () => {
        render(
            <AuthCard
                title="Custom Card"
                badge="Custom Badge"
                headline="Custom Headline"
                description="Custom Description"
                points={['Point One', 'Point Two']}
            >
                Body
            </AuthCard>
        );

        expect(screen.getAllByText('Custom Badge').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Custom Headline').length).toBeGreaterThan(0);
        expect(screen.getByText('Custom Description')).toBeInTheDocument();
        expect(screen.getByText('Point One')).toBeInTheDocument();
        expect(screen.getByText('Point Two')).toBeInTheDocument();
    });
});
