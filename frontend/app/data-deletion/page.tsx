import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DataDeletionPage() {
    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">Data Deletion Instructions</CardTitle>
                        <p className="text-muted-foreground">How to request deletion of your data</p>
                    </CardHeader>
                    <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
                        <section className="space-y-4">
                            <h2 className="text-xl font-semibold mt-6">Your Right to Data Deletion</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                At RubyShop, we respect your privacy and your right to control your personal data. You may
                                request the deletion of your personal information at any time.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">What Data We Store</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                When you interact with our service through Facebook Messenger or LINE, we may store:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>Your platform user ID (Facebook ID or LINE ID)</li>
                                <li>Your name (as provided by the platform)</li>
                                <li>Contact information you share (phone number, address)</li>
                                <li>Message history from your conversations</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">How to Request Data Deletion</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                To request deletion of your data, please follow these steps:
                            </p>
                            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                                <li>
                                    <strong>Email Request:</strong> Send an email to{' '}
                                    <a href="mailto:rubydeveloper168@gmail.com" className="text-primary hover:underline">
                                        rubydeveloper168@gmail.com
                                    </a>
                                </li>
                                <li>
                                    <strong>Subject Line:</strong> Use &quot;Data Deletion Request&quot; as your email subject
                                </li>
                                <li>
                                    <strong>Include:</strong> Your Facebook/LINE user ID or the email associated with your account
                                </li>
                                <li>
                                    <strong>Verification:</strong> We may ask you to verify your identity to protect your data
                                </li>
                            </ol>

                            <h2 className="text-xl font-semibold mt-6">Processing Time</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                We will process your data deletion request within <strong>30 days</strong> of receiving it.
                                You will receive a confirmation email once your data has been deleted.
                            </p>

                            <h2 className="text-xl font-semibold mt-6">What Happens After Deletion</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                Once your data is deleted:
                            </p>
                            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                                <li>All your personal information will be permanently removed from our systems</li>
                                <li>Your message history will be deleted</li>
                                <li>This action cannot be undone</li>
                                <li>If you interact with our service again, a new profile will be created</li>
                            </ul>

                            <h2 className="text-xl font-semibold mt-6">Facebook Data Deletion</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                You can also manage your Facebook app permissions directly through Facebook:
                            </p>
                            <ol className="list-decimal pl-6 text-muted-foreground space-y-2">
                                <li>Go to Facebook Settings</li>
                                <li>Navigate to Apps and Websites</li>
                                <li>Find &quot;RubyShop App&quot; and click Remove</li>
                                <li>This will revoke our access to your Facebook data</li>
                            </ol>

                            <h2 className="text-xl font-semibold mt-6">Contact Us</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                If you have any questions about data deletion or our privacy practices, please contact us:
                            </p>
                            <p className="text-muted-foreground">
                                <strong>Email:</strong>{' '}
                                <a href="mailto:rubydeveloper168@gmail.com" className="text-primary hover:underline">
                                    rubydeveloper168@gmail.com
                                </a>
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
