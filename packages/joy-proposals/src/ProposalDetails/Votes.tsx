import React from "react";
import { Header, Divider, Table, Image } from "semantic-ui-react";

import { Vote } from "./ProposalDetails";

type VotesProps = {
  votes: Vote[];
  total: number;
};

export default function Votes({ votes, total }: VotesProps) {
  return (
    <>
      <Header as="h3">{`All Votes: (${votes.length} / ${total})`}</Header>
      <Divider />
      <Table basic="very">
        <Table.Body>
          {votes.map((vote, idx) => (
            <Table.Row key={`${vote.by.name}-${idx}`}>
              <Table.Cell>{vote.value}</Table.Cell>
              <Table.Cell>
                <Image src={vote.by.avatar} avatar /> {vote.by.name}
              </Table.Cell>
              <Table.Cell className="text-secondary">{vote.createdAt}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </>
  );
}
