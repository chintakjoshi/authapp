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

    it('applies correct classes for light and dark mode backgrounds', () => {
        const { container } = render(
            <AuthCard title="Theme Test">Theme Child</AuthCard>
        );

        const outerDiv = container.querySelector('div.min-h-screen');
        expect(outerDiv).toHaveClass('bg-gray-100');
        expect(outerDiv).toHaveClass('dark:bg-gray-900');

        const cardDiv = container.querySelector('div.max-w-md');
        expect(cardDiv).toHaveClass('bg-white');
        expect(cardDiv).toHaveClass('dark:bg-gray-800');
    });
});